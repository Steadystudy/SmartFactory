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

        self.avoidance_mode = False
        self.avoidance_angle = 0

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

        # ✅ 이동 목표 방향 계산
        target_angle_rad = math.atan2(dy, dx)
        target_dir = math.degrees(target_angle_rad)
        if target_dir < 0:
            target_dir += 360

        # ✅ 현재 방향과 목표 방향 차이 계산
        diff = (target_dir - self.dir + 360) % 360
        if diff > 180:
            diff -= 360  # 반시계방향 회전 선택

        # ✅ 회전하기 (3초에 360도 회전)
        turn_speed = 360 / 3  # 120 degrees per second
        turn_per_step = turn_speed * REALTIME_INTERVAL  # 한 스텝당 회전량
        steps_to_turn = int(abs(diff) / turn_per_step)

        for _ in range(steps_to_turn):
            yield self.env.timeout(REALTIME_INTERVAL)
            if diff > 0:
                self.dir += turn_per_step
            else:
                self.dir -= turn_per_step
            self.dir %= 360
            self.update_status()

        # 정확히 목표방향으로 맞추기
        self.dir = target_dir
        self.update_status()

        # ✅ 이동
        for _ in range(steps):
            yield self.env.timeout(REALTIME_INTERVAL)

            if self.avoidance_mode:
                rad = math.radians(self.avoidance_angle)
                cos_r = math.cos(rad)
                sin_r = math.sin(rad)
                rotated_dx = dx * cos_r - dy * sin_r
                rotated_dy = dx * sin_r + dy * cos_r
                self.pos_x += rotated_dx
                self.pos_y += rotated_dy
            else:
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


