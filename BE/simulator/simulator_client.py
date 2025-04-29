import simpy.rt
import threading
import time
import math
from collections import deque
import socketio
from datetime import datetime


# ---------- 설정 ----------
REALTIME_INTERVAL = 0.01  # 좌표 갱신 주기 (초)
NUM_AMR = 3              # AMR 개수
SHARED_STATUS = {}        # 모든 AMR의 실시간 위치 상태
LOCK = threading.Lock()   # 공유 자원 보호
map_data = None
amrs = []  # <- 전역 AMR 리스트


# ---------- Socket.IO 서버 ----------
sio = socketio.Client()


@sio.event
def connect():
    print('✅ Connected to server')

@sio.event
def disconnect():
    print('❌ Disconnected from server')

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

def start_simulation():
    global amrs  # ✅ 전역 변수 사용 선언!

    if map_data is None:
        print("❌ 맵 데이터 없음. 시뮬레이션 시작할 수 없음.")
        return

    print("🚀 시뮬레이션 시작!")

    amrs = setup_amrs(env, map_data)  # ✅ 전역 amrs에 저장
    send_missions(amrs)

    threading.Thread(target=broadcast_status, daemon=True).start()
    threading.Thread(target=lambda: env.run(), daemon=True).start()


# ---------- AMR 클래스 ----------
class AMR:
    def __init__(self, env, amr_id, map_data, pos_x, pos_y):
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
                "timestamp": time.time()
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

        # 정확히 목표방향으로 맞추기
        self.dir = target_dir
        self.update_status()

        # ✅ 이동
        for _ in range(steps):
            yield self.env.timeout(REALTIME_INTERVAL)
            self.pos_x += dx
            self.pos_y += dy

            self.battery -= 0.0001
            if self.battery < 0:
                self.battery = 0

            self.update_status()

        self.pos_x = node["x"]
        self.pos_y = node["y"]
        self.current_node_id = node["id"]
        self.update_status()

    def get_distance(self, x1, y1, x2, y2):
        return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

# ---------- AMR 초기화 ----------
def setup_amrs(env, map_data):
    amrs = []

    amr = AMR(env, f"AMR001", map_data, 2.5, 17.5)
    amr.update_status()  # ✅ 최초 상태 넣기
    env.process(amr.run())
    amrs.append(amr)

    amr = AMR(env, f"AMR002", map_data, 5.5, 17.5)
    amr.update_status()  # ✅ 최초 상태 넣기
    env.process(amr.run())
    amrs.append(amr)

    amr = AMR(env, f"AMR003", map_data, 8.5, 17.5)
    amr.update_status()  # ✅ 최초 상태 넣기
    env.process(amr.run())
    amrs.append(amr)

    return amrs


# ---------- 미션 보내기 ----------
def send_missions(amrs):
    for i, amr in enumerate(amrs):

        if amr.id.endswith("1"):
            # AMR001, AMR002는 왼쪽 코스로
            amr.assign_mission({
                "missionId": 1,
                "missionType": "MOVING",
                "submissions": [
                    {"submissionId": "1", "nodeId": "12", "edgeId": "7"},
                    {"submissionId": "2", "nodeId": "13", "edgeId": "8"},
                    {"submissionId": "3", "nodeId": "2", "edgeId": "4"},
                    {"submissionId": "4", "nodeId": "14", "edgeId": "5"},
                    {"submissionId": "5", "nodeId": "20", "edgeId": "19"},
                    {"submissionId": "6", "nodeId": "4", "edgeId": "35"},
                    {"submissionId": "7", "nodeId": "21", "edgeId": "21"},
                    {"submissionId": "8", "nodeId": "27", "edgeId": "37"},
                    {"submissionId": "9", "nodeId": "6", "edgeId": "44"},
                    {"submissionId": "10", "nodeId": "26", "edgeId": "43"},
                    {"submissionId": "11", "nodeId": "32", "edgeId": "57"},
                    {"submissionId": "12", "nodeId": "8", "edgeId": "71"},
                ]
            })
        elif amr.id.endswith("2"):
            # 나머지 AMR은 오른쪽 코스로
            amr.assign_mission({
                "missionId": 2,
                "missionType": "MOVING",
                "submissions": [
                    {"submissionId": "1", "nodeId": "11", "edgeId": "7"},
                    {"submissionId": "2", "nodeId": "17", "edgeId": "12"},
                    {"submissionId": "3", "nodeId": "23", "edgeId": "29"},
                    {"submissionId": "4", "nodeId": "24", "edgeId": "45"},
                    {"submissionId": "5", "nodeId": "5", "edgeId": "39"},
                    {"submissionId": "6", "nodeId": "25", "edgeId": "40"},
                    {"submissionId": "7", "nodeId": "31", "edgeId": "54"},
                    {"submissionId": "8", "nodeId": "7", "edgeId": "68"},
                    {"submissionId": "9", "nodeId": "32", "edgeId": "70"},
                    {"submissionId": "10", "nodeId": "33", "edgeId": "65"},
                    {"submissionId": "11", "nodeId": "34", "edgeId": "66"},
                    {"submissionId": "12", "nodeId": "28", "edgeId": "61"},
                    {"submissionId": "13", "nodeId": "22", "edgeId": "38"},
                    {"submissionId": "14", "nodeId": "16", "edgeId": "23"},
                    {"submissionId": "15", "nodeId": "15", "edgeId": "11"},
                    {"submissionId": "16", "nodeId": "2", "edgeId": "6"},
                ]
            })
        elif amr.id.endswith("3"):
            amr.assign_mission({
                "missionId": 3,
                "missionType": "MOVING",
                "submissions": [
                    {"submissionId": "1", "nodeId": "2", "edgeId": "4"},
                    {"submissionId": "2", "nodeId": "14", "edgeId": "5"},
                    {"submissionId": "3", "nodeId": "20", "edgeId": "19"},
                    {"submissionId": "4", "nodeId": "4", "edgeId": "35"},
                    {"submissionId": "5", "nodeId": "19", "edgeId": "33"},
                    {"submissionId": "6", "nodeId": "13", "edgeId": "16"},
                    {"submissionId": "7", "nodeId": "1", "edgeId": "2"},
                    {"submissionId": "8", "nodeId": "13", "edgeId": "2"},
                    {"submissionId": "9", "nodeId": "19", "edgeId": "16"},
                    {"submissionId": "10", "nodeId": "3", "edgeId": "32"},
                    {"submissionId": "11", "nodeId": "18", "edgeId": "31"},
                    {"submissionId": "12", "nodeId": "17", "edgeId": "24"},
                    {"submissionId": "13", "nodeId": "23", "edgeId": "29"},
                    {"submissionId": "14", "nodeId": "24", "edgeId": "45"},
                    {"submissionId": "15", "nodeId": "25", "edgeId": "46"},
                    {"submissionId": "16", "nodeId": "6", "edgeId": "42"},
                ]
            })

# ---------- 상태 전송 ----------
def broadcast_status():
    while True:
        with LOCK:
            if not SHARED_STATUS:
                time.sleep(0.1)
                continue

            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            messages = []
            for amr_id, status in SHARED_STATUS.items():
                message = {
                    "header": {
                        "msgName": "AGV_STATE",
                        "time": now
                    },
                    "body": {
                        "worldX": status["x"],
                        "worldY": status["y"],
                        "dir": status["dir"],
                        "agvId": status["id"],
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
                messages.append(message)

            if messages:
                print(f"[Broadcast] {len(messages)} AMRs - example:", messages[0])  # ✅ 추가

            sio.emit('amr_status', messages)

        time.sleep(0.1)



# ---------- 메인 ----------
if __name__ == '__main__':
    env = simpy.rt.RealtimeEnvironment(factor=1.0, strict=False)

    sio.connect('http://localhost:5000')  # 1. 소켓 먼저 연결

    sio.wait()  # 2. 그리고 여기서 무한 대기


