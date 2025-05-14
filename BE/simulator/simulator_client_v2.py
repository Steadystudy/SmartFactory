import simpy.rt
import threading
import time
import math
from collections import deque
import websocket
import json
import random
from datetime import datetime
import os
# 최상단
from dotenv import load_dotenv
load_dotenv()  # .env 로부터 환경 변수 로드


# ---------- 설정 ----------
REALTIME_INTERVAL = 0.01  # 좌표 갱신 주기 (초)
SHARED_STATUS = {}        # 모든 AMR의 실시간 위치 상태
LOCK = threading.RLock()   # 공유 자원 보호
map_data = None
amrs = []  # <- 전역 AMR 리스트
INTERSECTING_EDGE_PAIRS = set()
NODE_RESERVATIONS = {}
simulation_started = False
REQUEST_DIST = 1.9
MAX_WAIT_BEFORE_IGNORE = 10.0
AMR_WS_URL = os.getenv("AMR_WS_URL","ws://localhost:8080/ws/amr")
if not AMR_WS_URL:
    raise RuntimeError("환경 변수 AMR_WS_URL 이 설정되지 않았습니다.")

# ---------- 메시지 핸들러 ----------
def on_open(ws):
    print(f"✅ WebSocket 연결 완료")

def on_close(ws):
    print(f"❌ WebSocket 연결 해제")

def on_message(ws, message):

    try:
        data = json.loads(message)
        msg_name = data.get("header", {}).get("msgName")
        # print(f"▶ PARSED msgName={repr(msg_name)}")  # ← 추가

        if   msg_name == "MAP_INFO":
            handle_map_info(data, ws)
        elif msg_name == "MISSION_ASSIGN":
            handle_mission_assign(data)
        elif msg_name == "MISSION_CANCEL":
            handle_mission_cancel(data)
        elif msg_name == "TRAFFIC_PERMIT":
            handle_traffic_permit(data)
        else:
            print("▶ Unhandled msgName:", repr(msg_name))  # ← 추가
    except Exception as e:
        print(f"❌ 메시지 처리 오류: {e}")


# ---------- WebSocket 서버 ----------
def make_ws_client():
    return websocket.WebSocketApp(
        AMR_WS_URL,
        on_message=on_message,
        on_open=on_open,
        on_close=on_close
    )

ws_clients = [make_ws_client() for _ in range(20)]

# ---------- 메시지 처리 함수 ----------
def handle_map_info(data, ws):
    global map_data, simulation_started
    if not simulation_started:
        simulation_started = True
        print("[MAP_INFO] 맵 데이터 수신 완료")
        raw_map = data['body']['mapData']

        nodes = {}
        for node in raw_map['areas']['nodes']:
            nodes[str(node['nodeId'])] = {
                'id': node['nodeId'],
                'x': node['worldX'],
                'y': node['worldY'],
                'nodeName' : node['nodeName'],
                'nodeType' : node['nodeType'],
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
    # else:
    #     print("⚠️ 시뮬레이션 이미 시작됨, 재시작 생략")


def handle_mission_assign(data):
    print("[MISSION_ASSIGN] 미션 수신:", data)
    mission = data['body']
    target_amr_id = data['header']['amrId']

    for amr in amrs:
        if amr.id != target_amr_id:
            continue

        # 1. 동시성 방지용 락 걸고, 마지막 완료 sub ID 읽기
        with LOCK:
            last_done = amr.current_submission_id

        # 2. 이미 완료한 서브미션(<= last_done) 은 건너뛰고
        raw_subs = mission["submissions"]
        if last_done is not None:
            filtered_subs = [
                sub for sub in raw_subs
                if sub["submissionId"] > last_done
            ]
        else:
            filtered_subs = raw_subs

        if not filtered_subs:
            # print(f"⚠️ {amr.id} 수행할 서브미션이 없습니다.")
            return

        # 3. 기존 미션 즉시 중단, 새로운 서브미션만 큐에 넣기
        amr.current_mission_id   = mission["missionId"]
        amr.current_mission_type = mission["missionType"]
        amr.assign_mission({
            "missionId":   mission["missionId"],
            "missionType": mission["missionType"],
            "submissions": filtered_subs
        }, replace=True)

        print(f"✅ {amr.id} 새 미션 수락 완료 (sub {filtered_subs[0]['submissionId']}부터 수행)")
        return



def handle_mission_cancel(data):
    print("[MISSION_CANCEL] 미션 취소 수신:", data)
    target_amr_id = data['header']['amrId']

    for amr in amrs:
        if amr.id == target_amr_id:
            amr.interrupt_flag = True
            amr.mission_queue.clear()
            amr.current_speed=0
            return

# ---------- 메시지 처리 함수 ----------
def handle_traffic_permit(data):

    header = data.get("header", {})
    amr_id = header.get("amrId")
    if not amr_id:
        print(f"❌ amrId 없음: {data}")
        return

    permit = data.get("body", {})
    node_id = permit.get("nodeId")

    # print(f"[DEBUG] {amr_id} got TRAFFIC_PERMIT for node {node_id} at env.now={env.now if 'env' in globals() else 'unknown'}")


    # amrId만으로 바로 처리
    for amr in amrs:
        if amr.id != amr_id:
            continue

        with LOCK:
            NODE_RESERVATIONS[node_id] = amr.id
            # print(f"✅ {amr.id} 노드 {node_id} 접근 예약됨")

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

    # 마지막 WebSocket 클라이언트에만 시작 메시지 전송
    last_ws = ws_clients[-1]
    start_message = {
        "header": {
            "msgName": "SIMULATION_START",
            "time": datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
        },
        "body": {
            "message": "Simulation has started"
        }
    }
    if last_ws.sock and last_ws.sock.connected:
        try:
            last_ws.send(json.dumps(start_message))
        except Exception as e:
            print(f"[WARN] 시작 메시지 전송 실패: {e}")

    amrs = setup_amrs(env, map_data)  # ✅ 전역 amrs에 저장

    threading.Thread(target=broadcast_status, daemon=True).start()
    threading.Thread(target=lambda: env.run(), daemon=True).start()


# ---------- AMR 클래스 ----------
class AMR:
    def __init__(self, env, amr_id, map_data, pos_x, pos_y, type, current_node_id):
        self.env = env
        self.id = amr_id
        self.map_data = map_data
        self.pos_x = pos_x
        self.pos_y = pos_y
        self.dir = 0  # 방향(degree)
        self.state = 1  # 1: IDLE, 2: PROCESSING
        self.battery = random.randint(60, 100)

        self.mission_queue = deque()
        self.current_mission = None
        self.interrupt_flag = False

        self.current_mission_id = "DUMMY"
        self.current_mission_type = None
        self.current_submission_id = None
        self.current_speed = 0
        self.loaded = False
        self.current_node_id = current_node_id
        self.type = type
        self.waiting_for_traffic = None  # (missionId, submissionId, nodeId)
        self.traffic_event = threading.Event()
        self.current_edge_id = None
        self.is_avoiding = False
        self.permit_requested = False

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
        prev = self.map_data["nodes"][str(self.current_node_id)]

        aborted = False
        for sub in mission["submissions"]:
            if self.interrupt_flag:
                # 중간 취소 감지
                aborted = True
                self.interrupt_flag = False
                # print(f"🚫 {self.id} 미션 중단 (sub {self.current_submission_id})")
                break

            # 다음 서브미션 실행
            self.current_submission_id = sub["submissionId"]
            self.current_edge_id = sub["edgeId"]
            node = self.map_data["nodes"][str(sub["nodeId"])]
            edge = self.map_data["edges"][str(sub["edgeId"])]
            self.current_speed = edge["speed"]

            yield from self.move_to_node(node, edge, prev)
            prev = node
        self.current_node_id = prev["id"]
        self.update_status()

        # ─── 완료/중단 후 초기화 ─────────────────────────────────────────

        # **취소(aborted)가 아닌 정상 완료일 때만 loaded 토글**
        if aborted:
            self.current_speed=0
            self.update_status()
            return

        self.state = 1
        if self.current_mission_type == "LOADING":
            self.loaded = True
        elif self.current_mission_type == "UNLOADING":
            self.loaded = False
        self.current_submission_id = None

        # 공통 초기화
        # self.current_mission_id = None
        # self.current_mission_type = None
        # self.current_edge_id = None
        self.current_speed = 0
        self.update_status()

    def move_to_node(self, node, edge, prev):
        # ─── 상수 정의 ─────────────────────────────────────
        STOP_DIST = 1.2
        RESUME_DIST = 1.7
        MIN_PAUSE_TIME = 0.3
        REQUEST_DIST = 1.9
        MAX_WAIT_BEFORE_IGNORE = 10.0

        # ─── 직선 이동 계산 ─────────────────────────────────
        distance = self.get_distance(self.pos_x, self.pos_y, node["x"], node["y"])
        speed = edge["speed"]
        duration = distance / speed
        steps = max(1, int(duration / REALTIME_INTERVAL))
        dx = (node["x"] - self.pos_x) / steps
        dy = (node["y"] - self.pos_y) / steps
        per_step_dist = speed * REALTIME_INTERVAL  # 한 스텝당 전진 거리

        # ─── 회전 정렬 ─────────────────────────────────────
        angle_rad = math.atan2(dy, dx)
        angle_std = math.degrees(angle_rad) % 360
        target_dir = (90 - angle_std) % 360
        diff = (target_dir - self.dir + 360) % 360
        if diff > 180: diff -= 360
        turn_speed = 360 / 3
        turn_per_step = turn_speed * REALTIME_INTERVAL
        steps_to_turn = int(abs(diff) / turn_per_step)

        for _ in range(steps_to_turn):
            yield self.env.timeout(REALTIME_INTERVAL)
            self.dir = (self.dir + turn_per_step * (1 if diff > 0 else -1)) % 360
            self.update_status()
        self.dir = target_dir
        self.current_node_id = prev["id"]
        self.update_status()

        # ─── TRAFFIC_REQ 준비 ───────────────────────────────
        self.traffic_event.clear()
        self.waiting_for_traffic = (
            self.current_mission_id,
            self.current_submission_id,
            node["id"]
        )
        self.permit_requested = False
        self.collision_ignored = False

        # ─── 회피 및 복귀 변수 초기화 ────────────────────────
        avoidance_steps = 0
        avoidance_steps_orig = 0
        avoidance_dx = avoidance_dy = 0.0
        return_steps = 0
        return_dx = return_dy = 0.0

        # ─── 이동 + 회피 루프 ────────────────────────────────
        for step_idx in range(steps):
            # 1) 시간 경과 & 전진
            yield self.env.timeout(REALTIME_INTERVAL)
            self.pos_x += dx
            self.pos_y += dy



            # 2) 측면 회피 중이면
            if avoidance_steps > 0:
                # # ─── 디버깅 로그 ───────────────────────────────────
                # print(
                #     f"[DEBUG] step={step_idx:4d} | "
                #     f"avoidance_steps={avoidance_steps:2d} | "
                #     f"return_steps={return_steps:2d} | "
                #     f"pos=({self.pos_x:6.2f},{self.pos_y:6.2f})"
                # )
                self.pos_x += avoidance_dx
                self.pos_y += avoidance_dy
                avoidance_steps -= 1
                # 회피 끝나면 복귀 설정
                if avoidance_steps == 0:
                    return_steps = avoidance_steps_orig
                    return_dx, return_dy = -avoidance_dx, -avoidance_dy
                    continue

            # 3) 복귀 중이면
            if return_steps > 0:
                self.pos_x += return_dx
                self.pos_y += return_dy
                return_steps -= 1

                # if return_steps == 0:
                #     print("[DEBUG] → 복귀 완료")

                # 4) 배터리 소모 · 상태 갱신
            self.battery = max(0, self.battery - 0.0001)
            self.update_status()

            # 5) TRAFFIC_REQ 한 번만
            node_dist = self.get_distance(self.pos_x, self.pos_y, node["x"], node["y"])
            if not self.permit_requested and node_dist <= REQUEST_DIST:
                req = {
                    "header": {
                        "msgName": "TRAFFIC_REQ",
                        "time": datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
                    },
                    "body": {
                        "missionId": self.current_mission_id,
                        "submissionId": self.current_submission_id,
                        "nodeId": node["id"],
                        "amrId": self.id
                    }
                }
                ws_clients[int(self.id[-3:]) - 1].send(json.dumps(req))
                self.permit_requested = True

            # 6) 충돌 감지
            if not self.collision_ignored:
                waiting_node = self.waiting_for_traffic[2]
                for other_id, other in SHARED_STATUS.items():
                    if other_id == self.id:
                        continue
                    if waiting_node and NODE_RESERVATIONS.get(waiting_node) == self.id:
                        break
                    if other["state"] != 2:
                        continue

                    # 헤드온 각도 체크
                    other_dir = other["dir"]
                    heading_diff = abs((other_dir - self.dir + 180) % 360 - 180)
                    vx, vy = other["x"] - self.pos_x, other["y"] - self.pos_y
                    dist = math.hypot(vx, vy)
                    # 충돌 조건
                    if dist <= STOP_DIST:
                        # 헤드온일 때만 측면 회피
                        if heading_diff > 150:
                            # 측면 단위 벡터
                            latx, laty = -dy, dx
                            norm = math.hypot(latx, laty) or 1
                            latx, laty = latx / norm, laty / norm

                            # 10스텝 동안 부드럽게 회피
                            avoidance_steps = 10
                            avoidance_dx = latx * per_step_dist
                            avoidance_dy = laty * per_step_dist
                            avoidance_steps_orig = avoidance_steps  # 복귀용 저장
                            break

                        # 그 외 기존 멈춤+백오프
                        dot = dx * vx + dy * vy
                        if dot <= 0:
                            continue
                        cos_a = max(-1.0, min(1.0, dot / (math.hypot(dx, dy) * dist)))
                        angle = math.degrees(math.acos(cos_a))
                        if angle > 60:
                            continue

                        # print(f"⛔ {self.id} stopping: {other_id} at {dist:.2f}m, angle {angle:.1f}°")
                        backoff = random.uniform(0, 0.2)
                        # print(f"⏳ {self.id} backing off {backoff:.2f}s")
                        yield self.env.timeout(backoff)

                        pause_start = self.env.now
                        resume_dead = self.env.now + MIN_PAUSE_TIME
                        while True:
                            yield self.env.timeout(REALTIME_INTERVAL)
                            if self.env.now < resume_dead:
                                continue
                            if self.env.now - pause_start >= MAX_WAIT_BEFORE_IGNORE:
                                # print(
                                #     f"⚠️ {self.id} waited {MAX_WAIT_BEFORE_IGNORE}s, ignoring collision with {other_id}")
                                self.collision_ignored = True
                                break
                            s = SHARED_STATUS.get(other_id)
                            if not s:
                                break
                            if math.hypot(s["x"] - self.pos_x, s["y"] - self.pos_y) >= RESUME_DIST:
                                # print(
                                #     f"✅ {self.id} resuming: {other_id} now {math.hypot(s['x'] - self.pos_x, s['y'] - self.pos_y):.2f}m away")
                                break
                        break

            # 7) TRAFFIC_PERMIT 대기
            node_dist = self.get_distance(self.pos_x, self.pos_y, node["x"], node["y"])
            if node_dist <= STOP_DIST and not self.traffic_event.is_set():
                while not self.traffic_event.is_set():
                    yield self.env.timeout(REALTIME_INTERVAL)

        # 4. 위치 정렬
        self.pos_x = node["x"]
        self.pos_y = node["y"]
        # self.current_node_id = node["id"]
        self.update_status()

        # 5. 노드 방향 회전 처리 (charging, docking 등)
        if node["nodeType"] in ("CHARGING", "DOCKING"):
            target_dir = node["direction"]
            diff = (target_dir - self.dir + 360) % 360
            if diff > 180:
                diff -= 360

            turn_speed = 360 / 3  # 120 deg/sec
            turn_per_step = turn_speed * REALTIME_INTERVAL
            steps_to_turn = int(abs(diff) / turn_per_step)

            for _ in range(steps_to_turn):
                yield self.env.timeout(REALTIME_INTERVAL)
                self.dir = (self.dir + turn_per_step * (1 if diff > 0 else -1)) % 360
                self.update_status()

            self.dir = target_dir
            self.update_status()

        # 6. docking 노드는 도착 후 작업 시간 5초간 대기
        if node["nodeType"] == "DOCKING":
            # print(f"🛠️ {self.id} docking 작업 중 (5초)")
            for _ in range(int(5 / REALTIME_INTERVAL)):
                yield self.env.timeout(REALTIME_INTERVAL)

        # 7. charging 노드에서는 충전
        if node["nodeType"] == "CHARGING":
            print(f"🔋 {self.id} 충전 시작 (100초 동안 1%씩)")
            for _ in range(int(100 / REALTIME_INTERVAL)):  # 100초 = 1초당 1%
                self.battery += 0.01
                if self.battery > 100:
                    self.battery = 100
                    break
                self.update_status()
                yield self.env.timeout(REALTIME_INTERVAL)

        with LOCK:
            if NODE_RESERVATIONS.get(self.current_node_id) == self.id:
                del NODE_RESERVATIONS[self.current_node_id]

    def get_distance(self, x1, y1, x2, y2):
        return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)






# ---------- AMR 초기화 ----------
def setup_amrs(env, map_data):
    amrs = []

    amr_start_positions = [
        (115, 7.5, 6.5),
        (103, 21.5, 3.5),
        (106, 36.5, 3.5),
        (109, 47.5, 3.5),
        (112, 62.5, 3.5),
        (132, 76.5, 6.5),
        (133, 7.5, 38.5),
        (136, 16.5, 38.5),
        (140, 36.5, 38.5),
        (143, 47.5, 38.5),
        (147, 67.5, 38.5),
        (150, 76.5, 38.5),
        (169, 7.5, 73.5),
        (189, 21.5, 76.5),
        (192, 36.5, 76.5),
        (195, 47.5, 76.5),
        (198, 62.5, 76.5),
        (186, 76.5, 73.5),
        (65, 0.5, 32.5),
        (71, 0.5, 48.5),
    ]

    for i, (n, x, y) in enumerate(amr_start_positions):
        amr_id = f"AMR{str(i + 1).zfill(3)}"
        amr_type = 0 if i < 10 else 1  # 0번~9번 → type=0, 10번~19번 → type=1
        amr = AMR(env, amr_id, map_data, x, y, amr_type, n)
        amr.update_status()
        env.process(amr.run())
        amrs.append(amr)

    return amrs



def broadcast_status():
    while True:
        try:
            with LOCK:
                if not SHARED_STATUS:
                    time.sleep(0.1)
                    continue

                now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
                for i, (amr_id, status) in enumerate(SHARED_STATUS.items()):
                    message = {
                        "header": {
                            "msgName": "AMR_STATE",
                            "time": now
                        },
                        "body": {
                            "worldX": status["x"],
                            "worldY": status["y"],
                            "dir": status["dir"],
                            "amrId": status["id"],
                            "state": status["state"],
                            "battery": status["battery"],
                            "currentNode": status.get("currentNode", ""),
                            "currentEdge": status.get("currentEdge", ""),
                            "loading": True if status["loaded"] else False,
                            "missionId": status.get("missionId", ""),
                            "submissionId": status.get("submissionId", "0"),
                            "linearVelocity": status.get("speed", 0),
                            "missionType": status.get("missionType", 0),
                            "errorList": ""
                        }
                    }

                    if i < len(ws_clients):
                        try:
                            # print(f"✅ [BROADCAST] amrId: {message['body']['amrId']}, x: {message['body']['worldX']}, y: {message['body']['worldY']}, currentNode: {message['body']['currentNode']}")
                            ws_clients[i].send(json.dumps(message))
                        except Exception as e:
                            print(f"❌ [BROADCAST] WebSocket 전송 실패: {e}")
                            print(f"❌ [BROADCAST] WebSocket 연결이 종료된 AMR: {amr_id}")
                            ws_clients[i].close()

            time.sleep(0.1)

        except Exception as global_exception:
            print(f"❌ [BROADCAST] 스레드가 종료되었습니다: {global_exception}")
            time.sleep(1)  # 잠시 대기 후 재시작


# ---------- 메인 ----------
if __name__ == '__main__':
    env = simpy.rt.RealtimeEnvironment(factor=1.0, strict=False)
    for ws in ws_clients:
        threading.Thread(target=ws.run_forever, daemon=True).start()

    # 🔒 메인 스레드가 종료되지 않도록 유지
    while True:
        time.sleep(1)


