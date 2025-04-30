import simpy.rt
import threading
import time
import math
from collections import deque
import socketio
from datetime import datetime


# ---------- 설정 ----------
REALTIME_INTERVAL = 0.01  # 좌표 갱신 주기 (초)
SHARED_STATUS = {}        # 모든 AMR의 실시간 위치 상태
LOCK = threading.Lock()   # 공유 자원 보호
map_data = None
amrs = []  # <- 전역 AMR 리스트


# ---------- Socket.IO 서버 ----------
sios = []
for _ in range(20):
    sio = socketio.Client()
    sios.append(sio)


def setup_socket_handlers(sio):
    @sio.event
    def connect():
        print(f'✅ Connected to server: {sio.sid}')

    @sio.event
    def disconnect():
        print(f'❌ Disconnected from server: {sio.sid}')

    @sio.on('MAP_INFO')
    def on_map_info(data):
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

        print("✅ 맵 저장 완료! 바로 시뮬레이션 시작합니다.")
        start_simulation()  # ✅ 여기서 바로 시작!

    @sio.on('MISSION_ASSIGN')
    def on_mission_assign(data):
        print("[MISSION_ASSIGN] 미션 수신:", data)

        mission = data['body']
        target_amr_id = data['header']['amrId']  # ✅ amrId로 대상 AMR 찾기

        found = False
        for amr in amrs:
            if amr.id == target_amr_id:
                amr.assign_mission({
                    "missionId": mission["missionId"],
                    "missionType": mission["missionType"],
                    "submissions": mission["submissions"]
                })
                found = True
                break

        if not found:
            print(f"❌ {target_amr_id} AMR을 찾을 수 없습니다.")

    @sio.on('MISSION_CANCEL')
    def on_mission_cancel(data):
        print("[MISSION_CANCEL] 미션 취소 수신:", data)

        target_amr_id = data['header']['amrId']  # ✅ amrId로 대상 AMR 찾기

        found = False
        for amr in amrs:
            if amr.id == target_amr_id:
                amr.interrupt_flag = True
                found = True
                break

        if not found:
            print(f"❌ {target_amr_id} AMR을 찾을 수 없습니다.")

    @sio.on('TRAFFIC_PERMIT')
    def on_traffic_permit(data):
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
            node = self.map_data["nodes"][sub["nodeId"]]
            edge = self.map_data["edges"][sub["edgeId"]]
            self.current_speed = edge["speed"]
            self.current_edge_id = sub["edgeId"]
            yield from self.move_to_node(node, edge)
        self.state = 1
        self.current_mission_id = None
        self.current_mission_type = None
        self.current_submission_id = None
        self.current_speed = 0
        self.update_status()

    def move_to_node(self, node, edge):
        distance = self.get_distance(self.pos_x, self.pos_y, node["x"], node["y"])
        speed = edge["speed"]
        duration = distance / speed
        steps = max(1, int(duration / REALTIME_INTERVAL))
        dx = (node["x"] - self.pos_x) / steps
        dy = (node["y"] - self.pos_y) / steps

        # 1) 표준 각도 (X축 기준, 반시계 +)
        angle_rad = math.atan2(dy, dx)
        angle_std = math.degrees(angle_rad) % 360

        # 2) Y축+을 0°, X축+을 90°로 매핑하고 시계 방향을 +로
        #    → target_dir이 0°일 때 Y양수, 90°일 때 X양수
        target_dir = (90 - angle_std) % 360

        # 3) 현재 방향(self.dir)과 목표 방향 차이 계산 (±180°)
        diff = (target_dir - self.dir + 360) % 360
        if diff > 180:
            diff -= 360

        # 4) 회전하기 (3초에 360° 회전)
        turn_speed = 360 / 3  # degrees per second
        turn_per_step = turn_speed * REALTIME_INTERVAL
        steps_to_turn = int(abs(diff) / turn_per_step)

        for _ in range(steps_to_turn):
            yield self.env.timeout(REALTIME_INTERVAL)
            # diff > 0 → 시계 방향(+), diff < 0 → 반시계 방향(−)
            self.dir = (self.dir + turn_per_step * (1 if diff > 0 else -1)) % 360
            self.update_status()

        # 5) 정확히 목표 방향으로 스냅
        self.dir = target_dir
        self.update_status()

        # 2) TRAFFIC_REQ → 출발 시 즉시 요청
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
        sios[int(self.id[-3:]) - 1].emit('traffic_req', req_message)

        # 3) 이동 + PERMIT 도착 전이면 대기
        for _ in range(steps):
            yield self.env.timeout(REALTIME_INTERVAL)
            self.pos_x += dx
            self.pos_y += dy
            self.battery -= 0.0001
            if self.battery < 0:
                self.battery = 0
            self.update_status()

            # 도착 전 PERMIT 확인
            angle_rad_dir = math.radians((90 - self.dir) % 360)
            front_x = self.pos_x + math.cos(angle_rad_dir) * 0.6
            front_y = self.pos_y + math.sin(angle_rad_dir) * 0.6
            front_dist = self.get_distance(front_x, front_y, node["x"], node["y"])

            if front_dist <= 0.1 and not self.traffic_event.is_set():
                while not self.traffic_event.is_set():
                    yield self.env.timeout(REALTIME_INTERVAL)

        # 4) 위치 정렬
        self.pos_x = node["x"]
        self.pos_y = node["y"]
        self.current_node_id = node["id"]
        self.update_status()

    def get_distance(self, x1, y1, x2, y2):
        return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

    def is_head_on_collision(self):
        for other_id, other in SHARED_STATUS.items():
            if other_id == self.id:
                continue

            if other.get("currentEdge") != self.current_edge_id:
                continue

            dist = self.get_distance(self.pos_x, self.pos_y, other["x"], other["y"])
            if dist > 1.2:
                continue

            dir_diff = abs((self.dir - other["dir"] + 360) % 360)
            if 150 < dir_diff < 210:
                return True

        return False

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
                if i < len(sios):
                    sios[i].emit('amr_status', message)
        time.sleep(0.1)



# ---------- 메인 ----------
if __name__ == '__main__':
    env = simpy.rt.RealtimeEnvironment(factor=1.0, strict=False)
    for sio in sios:
        setup_socket_handlers(sio)
        sio.connect('http://localhost:5000')
        threading.Thread(target=sio.wait, daemon=True).start()



