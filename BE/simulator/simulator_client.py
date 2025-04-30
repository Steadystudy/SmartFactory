import simpy.rt
import threading
import time
import math
from collections import deque
import websocket
import json
from datetime import datetime


# ---------- 설정 ----------
REALTIME_INTERVAL = 0.01  # 좌표 갱신 주기 (초)
SHARED_STATUS = {}        # 모든 AMR의 실시간 위치 상태
LOCK = threading.Lock()   # 공유 자원 보호
map_data = None
amrs = []  # <- 전역 AMR 리스트
INTERSECTING_EDGE_PAIRS = set()

# ---------- WebSocket 서버 ----------
ws_clients = []
for _ in range(20):
    ws = websocket.WebSocketApp(
        "ws://localhost:8080/ws/amr",
        on_message=lambda ws, msg: on_message(ws, msg),
        on_open=lambda ws: on_open(ws),
        on_close=lambda ws: on_close(ws)
    )
    ws_clients.append(ws)

# ---------- 메시지 핸들러 ----------
def on_open(ws):
    print(f"✅ WebSocket 연결 완료")

def on_close(ws):
    print(f"❌ WebSocket 연결 해제")

def on_message(ws, message):
    try:
        data = json.loads(message)
        msg_name = data.get("header", {}).get("msgName")

        if msg_name == "MAP_INFO":
            handle_map_info(data, ws)
        elif msg_name == "MISSION_ASSIGN":
            handle_mission_assign(data)
        elif msg_name == "MISSION_CANCEL":
            handle_mission_cancel(data)
        elif msg_name == "TRAFFIC_PERMIT":
            handle_traffic_permit(data)
    except Exception as e:
        print(f"❌ 메시지 처리 오류: {e}")

# ---------- 메시지 처리 함수 ----------
def handle_map_info(data, ws):
    global map_data

    print("[MAP_INFO] 맵 데이터 수신 완료")
    raw_map = data['body']['mapData']

    nodes = {}
    for node in raw_map['areas']['nodes']:
        nodes[str(node['nodeId'])] = {
            'id': node['nodeId'],
            'x': node['worldX'],
            'y': node['worldY'],
            'direction': node['direction']
        }

    edges = {}
    for edge in raw_map['areas']['edges']:
        edges[str(edge['edgeId'])] = {
            'node1': edge['node1'],
            'node2': edge['node2'],
            'speed': edge['speed'],
            'edgeDirection': edge['edgeDirection']
        }

    map_data = {
        "nodes": nodes,
        "edges": edges
    }

    INTERSECTING_EDGE_PAIRS.update(compute_intersecting_edges(map_data))
    print("✅ 맵 저장 완료! 시뮬레이션 시작")
    start_simulation()

def handle_mission_assign(data):
    print("[MISSION_ASSIGN] 미션 수신:", data)

    mission = data['body']
    target_amr_id = data['header']['amrId']

    for amr in amrs:
        if amr.id == target_amr_id:
            amr.assign_mission({
                "missionId": mission["missionId"],
                "missionType": mission["missionType"],
                "submissions": mission["submissions"]
            })
            return

    print(f"❌ {target_amr_id} AMR을 찾을 수 없습니다.")

def handle_mission_cancel(data):
    print("[MISSION_CANCEL] 미션 취소 수신:", data)
    target_amr_id = data['header']['amrId']

    for amr in amrs:
        if amr.id == target_amr_id:
            amr.interrupt_flag = True
            return

    print(f"❌ {target_amr_id} AMR을 찾을 수 없습니다.")

def handle_traffic_permit(data):
    permit = data['body']
    mission_id = permit["missionId"]
    submission_id = permit["submissionId"]
    node_id = permit["nodeId"]

    for amr in amrs:
        if (amr.current_mission_id == mission_id and
                amr.current_submission_id == submission_id and
                amr.waiting_for_traffic == (mission_id, submission_id, node_id)):
            print(f"✅ {amr.id} - 이동 허가 수신 (Node: {node_id})")
            amr.traffic_event.set()
            break

# ---------- 교차 간선 계산 ----------
def edges_intersect(p1, p2, q1, q2):
    def ccw(a, b, c):
        return (c["y"] - a["y"]) * (b["x"] - a["x"]) > (b["y"] - a["y"]) * (c["x"] - a["x"])
    return ccw(p1, q1, q2) != ccw(p2, q1, q2) and ccw(p1, p2, q1) != ccw(p1, p2, q2)

def compute_intersecting_edges(map_data):
    intersecting_edge_pairs = set()
    edges = map_data["edges"]
    nodes = map_data["nodes"]
    edge_list = []

    for eid, edge in edges.items():
        n1 = nodes[str(edge["node1"])]
        n2 = nodes[str(edge["node2"])]
        edge_list.append((eid, {"x": n1["x"], "y": n1["y"]}, {"x": n2["x"], "y": n2["y"]}))

    for i in range(len(edge_list)):
        eid1, a1, a2 = edge_list[i]
        for j in range(i + 1, len(edge_list)):
            eid2, b1, b2 = edge_list[j]
            if edges_intersect(a1, a2, b1, b2):
                intersecting_edge_pairs.add((eid1, eid2))
                intersecting_edge_pairs.add((eid2, eid1))

    return intersecting_edge_pairs

def start_simulation():
    global amrs  # ✅ 전역 변수 사용 선언!

    if map_data is None:
        print("❌ 맵 데이터 없음. 시뮬레이션 시작할 수 없음.")
        return

    print("🚀 시뮬레이션 시작!")

    amrs = setup_amrs(env, map_data)  # ✅ 전역 amrs에 저장

    threading.Thread(target=broadcast_status, daemon=True).start()
    threading.Thread(target=lambda: env.run(), daemon=True).start()


# ---------- AMR 클래스 ----------
class AMR:
    def __init__(self, env, amr_id, map_data, pos_x, pos_y, type):
        self.env = env
        self.id = amr_id
        self.map_data = map_data
        self.pos_x = pos_x
        self.pos_y = pos_y
        self.dir = 0  # 방향(degree)
        self.state = 1  # 1: IDLE, 2: PROCESSING
        self.battery = 100

        self.mission_queue = deque()
        self.current_mission = None
        self.interrupt_flag = False

        self.current_mission_id = None
        self.current_mission_type = None
        self.current_submission_id = None
        self.current_speed = 0
        self.loaded = False
        self.current_node_id = None
        self.type = type
        self.waiting_for_traffic = None  # (missionId, submissionId, nodeId)
        self.traffic_event = threading.Event()
        self.current_edge_id = None
        self.is_avoiding = False

    def update_status(self):
        with LOCK:
            SHARED_STATUS[self.id] = {
                "id": self.id,
                "x": self.pos_x,
                "y": self.pos_y,
                "dir": self.dir,
                "state": self.state,
                "battery": self.battery,
                "missionId": self.current_mission_id,
                "missionType": self.current_mission_type,
                "submissionId": self.current_submission_id,
                "currentNode": self.current_node_id,
                "speed": self.current_speed,
                "loaded": self.loaded,
                "timestamp": time.time(),
                "type": self.type,
                "currentEdge": self.current_edge_id,
                "isAvoiding": self.is_avoiding,

            }

    def assign_mission(self, mission, replace=False):
        if replace:
            self.interrupt_flag = True
            self.mission_queue.clear()
        self.mission_queue.append(mission)

    def run(self):
        while True:
            if self.interrupt_flag:
                self.interrupt_flag = False
                self.current_mission = None

            if not self.current_mission and self.mission_queue:
                self.current_mission = self.mission_queue.popleft()
                yield from self.process_mission(self.current_mission)
                self.current_mission = None
            else:
                yield self.env.timeout(REALTIME_INTERVAL)

    def process_mission(self, mission):
        self.state = 2
        self.current_mission_id = mission["missionId"]
        self.current_mission_type = mission["missionType"]
        self.update_status()

        for sub in mission["submissions"]:
            self.current_submission_id = sub["submissionId"]

            # ✅ 여기에 넣으세요
            self.current_edge_id = sub["edgeId"]

            node = self.map_data["nodes"][sub["nodeId"]]
            edge = self.map_data["edges"][sub["edgeId"]]
            self.current_speed = edge["speed"]
            yield from self.move_to_node(node, edge)

        # ✅ 미션 완료 후 초기화
        self.state = 1
        self.current_mission_id = None
        self.current_mission_type = None
        self.current_submission_id = None
        self.current_edge_id = None
        self.current_speed = 0
        self.update_status()

    def move_to_node(self, node, edge):
        distance = self.get_distance(self.pos_x, self.pos_y, node["x"], node["y"])
        speed = edge["speed"]
        duration = distance / speed
        steps = max(1, int(duration / REALTIME_INTERVAL))
        dx = (node["x"] - self.pos_x) / steps
        dy = (node["y"] - self.pos_y) / steps

        # 1. 방향 계산
        angle_rad = math.atan2(dy, dx)
        angle_std = math.degrees(angle_rad) % 360
        target_dir = (90 - angle_std) % 360

        diff = (target_dir - self.dir + 360) % 360
        if diff > 180:
            diff -= 360

        turn_speed = 360 / 3
        turn_per_step = turn_speed * REALTIME_INTERVAL
        steps_to_turn = int(abs(diff) / turn_per_step)

        for _ in range(steps_to_turn):
            yield self.env.timeout(REALTIME_INTERVAL)
            self.dir = (self.dir + turn_per_step * (1 if diff > 0 else -1)) % 360
            self.update_status()

        self.dir = target_dir
        self.update_status()

        # 2. TRAFFIC_REQ 요청
        self.traffic_event.clear()
        self.waiting_for_traffic = (
            self.current_mission_id,
            self.current_submission_id,
            node["id"]
        )

        req_message = {
            "header": {
                "msgName": "TRAFFIC_REQ",
                "time": datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            },
            "body": {
                "missionId": self.current_mission_id,
                "nodeId": node["id"],
                "agvId": self.id
            }
        }
        ws_clients[int(self.id[-3:]) - 1].send(json.dumps(req_message))


        # 3. 이동
        for _ in range(steps):
            # 🔴 정면 충돌 감지 시 회피 시작
            if self.is_head_on_collision():
                print(f"⚠️ {self.id} 정면 충돌 → 우회 기동")
                yield from self.avoid_and_recover(dx, dy, speed, target_dir)
                continue

            # 🟠 교차 충돌 감지 시 대기 or 회피
            conflict_action = self.is_intersection_conflict(INTERSECTING_EDGE_PAIRS)
            if conflict_action == "wait":
                print(f"🛑 {self.id} 교차점 충돌 감지 - 정지 대기")
                yield from self.wait_until_clear(INTERSECTING_EDGE_PAIRS)
            elif conflict_action == "avoid":
                print(f"⚠️ {self.id} 교차점 충돌 감지 - 회피 기동 시작")
                yield from self.avoid_and_recover(dx, dy, speed, target_dir)
                continue

            # 정상 이동
            yield self.env.timeout(REALTIME_INTERVAL)
            self.pos_x += dx
            self.pos_y += dy
            self.battery -= 0.0001
            if self.battery < 0:
                self.battery = 0
            self.update_status()

            # PERMIT 확인
            angle_rad_dir = math.radians((90 - self.dir) % 360)
            front_x = self.pos_x + math.cos(angle_rad_dir) * 0.6
            front_y = self.pos_y + math.sin(angle_rad_dir) * 0.6
            front_dist = self.get_distance(front_x, front_y, node["x"], node["y"])

            if front_dist <= 0.1 and not self.traffic_event.is_set():
                while not self.traffic_event.is_set():
                    yield self.env.timeout(REALTIME_INTERVAL)

        # 4. 위치 정렬
        self.pos_x = node["x"]
        self.pos_y = node["y"]
        self.current_node_id = node["id"]
        self.update_status()

    def get_distance(self, x1, y1, x2, y2):
        return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

    def is_head_on_collision(self):
        with LOCK:  # 🔐 상태 정보는 LOCK으로 보호된 SHARED_STATUS에서 확인
            for other_id, other in SHARED_STATUS.items():
                if other_id == self.id:
                    continue  # 자기 자신은 제외

                # ✅ 같은 edge 위에 있는가?
                if other.get("currentEdge") != self.current_edge_id or self.current_edge_id is None:
                    continue

                # ✅ 두 AMR의 거리 확인
                dist = self.get_distance(self.pos_x, self.pos_y, other["x"], other["y"])
                if dist > 1.2:
                    continue

                # ✅ 방향이 서로 반대인지 확인 (180도 ±30도)
                dir_diff = abs((self.dir - other["dir"] + 360) % 360)
                if 150 < dir_diff < 210:
                    print(f"⚠️ 정면 충돌 감지: {self.id} vs {other['id']} (거리: {dist:.2f}, 각도차: {dir_diff:.1f})")
                    return True

        return False

    def is_intersection_conflict(self, intersecting_edge_pairs, conflict_distance=2):
        with LOCK:
            for other_id, other in SHARED_STATUS.items():
                if other_id == self.id:
                    continue
                if (self.current_edge_id, other.get("currentEdge")) not in intersecting_edge_pairs:
                    continue

                dist = self.get_distance(self.pos_x, self.pos_y, other["x"], other["y"])
                if dist < conflict_distance:
                    # 내가 늦게 진입했으면 대기 (회피 안 함)
                    if SHARED_STATUS[self.id]["timestamp"] > other["timestamp"]:
                        return "wait"
                    else:
                        return "avoid"
        return None

    def wait_until_clear(self, intersecting_edge_pairs):
        while self.is_intersection_conflict(intersecting_edge_pairs) == "wait":
            yield self.env.timeout(REALTIME_INTERVAL)

    def avoid_and_recover(self, dx, dy, speed, target_dir):
        self.is_avoiding = True
        offset_x, offset_y = self.get_offset_position(self.pos_x, self.pos_y, offset=0.6)
        offset_dx = offset_x - self.pos_x
        offset_dy = offset_y - self.pos_y

        offset_angle_rad = math.atan2(offset_dy, offset_dx)
        self.dir = (90 - math.degrees(offset_angle_rad)) % 360
        self.update_status()

        offset_steps = int(
            self.get_distance(self.pos_x, self.pos_y, offset_x, offset_y) / (speed * REALTIME_INTERVAL))
        for _ in range(offset_steps):
            yield self.env.timeout(REALTIME_INTERVAL)
            self.pos_x += offset_dx / offset_steps
            self.pos_y += offset_dy / offset_steps
            self.update_status()

        while self.is_intersection_conflict(INTERSECTING_EDGE_PAIRS) == "avoid":
            yield self.env.timeout(REALTIME_INTERVAL)

        self.is_avoiding = False
        self.dir = target_dir
        self.update_status()

    def get_offset_position(self, x, y, offset=0.6):
        angle_rad = math.radians((90 - self.dir) % 360)
        offset_angle = angle_rad - math.pi / 2  # 오른쪽 기준
        offset_x = x + math.cos(offset_angle) * offset
        offset_y = y + math.sin(offset_angle) * offset
        return offset_x, offset_y


# ---------- AMR 초기화 ----------
def setup_amrs(env, map_data):
    amrs = []

    amr_start_positions = [
        (0.5, 69.5), (0.5, 67.5), (0.5, 65.5), (0.5, 63.5),
        (0.5, 47.5), (0.5, 45.5), (0.5, 43.5), (0.5, 37.5),
        (0.5, 35.5), (0.5, 33.5), (0.5, 31.5), (0.5, 16.5),
        (0.5, 14.5), (0.5, 12.5), (0.5, 10.5), (3.5, 69.5),
        (3.5, 67.0), (3.5, 65.5), (3.5, 63.5), (3.5, 47.5)
    ]

    for i, (x, y) in enumerate(amr_start_positions):
        amr_id = f"AMR{str(i + 1).zfill(3)}"
        amr_type = 0 if i < 10 else 1  # 0번~9번 → type=0, 10번~19번 → type=1
        amr = AMR(env, amr_id, map_data, x, y, type=amr_type)
        amr.update_status()
        env.process(amr.run())
        amrs.append(amr)

    return amrs



# ---------- 상태 전송 ----------
def broadcast_status():
    while True:
        with LOCK:
            if not SHARED_STATUS:
                time.sleep(0.1)
                continue

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            for i, (amr_id, status) in enumerate(SHARED_STATUS.items()):
                message = {
                    "header": {
                        "msgName": "AGV_STATE",
                        "time": now
                    },
                    "body": {
                        "worldX": status["x"],
                        "worldY": status["y"],
                        "dir": status["dir"],
                        "amrId": status["id"],
                        "type": status["type"],
                        "state": status["state"],
                        "battary": status["battery"],
                        "currentNode": status.get("currentNode", ""),
                        "loading": "1" if status["loaded"] else "0",
                        "missionId": status.get("missionId", ""),
                        "submissionId": status.get("submissionId", ""),
                        "linearVelocity": status.get("speed", 0),
                        "errorList": []
                    }
                }
                if i < len(ws_clients):
                    ws_clients[i].send(json.dumps(message))
        time.sleep(0.1)



# ---------- 메인 ----------
if __name__ == '__main__':
    env = simpy.rt.RealtimeEnvironment(factor=1.0, strict=False)
    for ws in ws_clients:
        threading.Thread(target=ws.run_forever, daemon=True).start()



