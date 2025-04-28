import simpy.rt
import threading
import time
import math
from collections import deque


# ---------- 설정 ----------
REALTIME_INTERVAL = 0.01  # 좌표 갱신 주기 (초)
NUM_AMR = 3              # AMR 개수
SHARED_STATUS = {}        # 모든 AMR의 실시간 위치 상태
LOCK = threading.Lock()   # 공유 자원 보호

# ---------- AMR 클래스 ----------
class AMR:
    def __init__(self, env, amr_id, map_data, pos_x, pos_y):
        self.env = env
        self.id = amr_id
        self.map_data = map_data
        self.pos_x = 0
        self.pos_y = 0
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

    def update_status(self):
        with LOCK:
            SHARED_STATUS[self.id] = {
                "x": self.pos_x,
                "y": self.pos_y,
                "dir": self.dir,
                "state": self.state,
                "battery": self.battery,
                "missionId": self.current_mission_id,
                "missionType": self.current_mission_type,
                "submissionId": self.current_submission_id,
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
            self.pos_x += dx
            self.pos_y += dy

            self.battery -= 0.0001
            if self.battery < 0:
                self.battery = 0

            self.update_status()

        self.pos_x = node["x"]
        self.pos_y = node["y"]
        self.update_status()

    def get_distance(self, x1, y1, x2, y2):
        return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)

# ---------- AMR 초기화 ----------
def setup_amrs(env, map_data):
    amrs = []

    amr = AMR(env, f"AMR001", map_data, 2.5, 17.5)
    env.process(amr.run())
    amrs.append(amr)

    amr = AMR(env, f"AMR002", map_data, 5.5, 17.5)
    env.process(amr.run())
    amrs.append(amr)

    amr = AMR(env, f"AMR003", map_data, 8.5, 17.5)
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


# ---------- 메인 ----------
if __name__ == '__main__':
    env = simpy.rt.RealtimeEnvironment(factor=1.0, strict=False)

    # 샘플 맵 데이터 (생략 가능, 네가 쓰던 거 그대로 넣으면 됨)
    map_data = {
        "nodes": {
            "1": {
                "x": 9.5,
                "y": 19.5
            },
            "2": {
                "x": 11.5,
                "y": 19.5
            },
            "3": {
                "x": 9.5,
                "y": 12.5
            },
            "4": {
                "x": 11.5,
                "y": 12.5
            },
            "5": {
                "x": 9.5,
                "y": 7.5
            },
            "6": {
                "x": 11.5,
                "y": 7.5
            },
            "7": {
                "x": 9.5,
                "y": 0.5
            },
            "8": {
                "x": 11.5,
                "y": 0.5
            },
            "9": {
                "x": 0.5,
                "y": 12.5
            },
            "10": {
                "x": 0.5,
                "y": 7.5
            },
            "11": {
                "x": 2.5,
                "y": 17.5
            },
            "12": {
                "x": 5.5,
                "y": 17.5
            },
            "13": {
                "x": 8.5,
                "y": 17.5
            },
            "14": {
                "x": 11.5,
                "y": 17.5
            },
            "15": {
                "x": 14.5,
                "y": 17.5
            },
            "16": {
                "x": 17.5,
                "y": 17.5
            },
            "17": {
                "x": 2.5,
                "y": 14.5
            },
            "18": {
                "x": 5.5,
                "y": 14.5
            },
            "19": {
                "x": 8.5,
                "y": 14.5
            },
            "20": {
                "x": 11.5,
                "y": 14.5
            },
            "21": {
                "x": 14.5,
                "y": 14.5
            },
            "22": {
                "x": 17.5,
                "y": 14.5
            },
            "23": {
                "x": 2.5,
                "y": 5.5
            },
            "24": {
                "x": 5.5,
                "y": 5.5
            },
            "25": {
                "x": 8.5,
                "y": 5.5
            },
            "26": {
                "x": 11.5,
                "y": 5.5
            },
            "27": {
                "x": 14.5,
                "y": 5.5
            },
            "28": {
                "x": 17.5,
                "y": 5.5
            },
            "29": {
                "x": 2.5,
                "y": 2.5
            },
            "30": {
                "x": 5.5,
                "y": 2.5
            },
            "31": {
                "x": 8.5,
                "y": 2.5
            },
            "32": {
                "x": 11.5,
                "y": 2.5
            },
            "33": {
                "x": 14.5,
                "y": 2.5
            },
            "34": {
                "x": 17.5,
                "y": 2.5
            },
            "35": {
                "x": 0.5,
                "y": 10.5
            }
        },
        "edges": {
            "1": {
                "node1": 1,
                "node2": 12,
                "speed": 0.5
            },
            "2": {
                "node1": 1,
                "node2": 13,
                "speed": 0.5
            },
            "3": {
                "node1": 1,
                "node2": 14,
                "speed": 0.5
            },
            "4": {
                "node1": 2,
                "node2": 13,
                "speed": 0.5
            },
            "5": {
                "node1": 1,
                "node2": 14,
                "speed": 0.5
            },
            "6": {
                "node1": 1,
                "node2": 15,
                "speed": 0.5
            },
            "7": {
                "node1": 11,
                "node2": 12,
                "speed": 1
            },
            "8": {
                "node1": 12,
                "node2": 13,
                "speed": 1
            },
            "9": {
                "node1": 13,
                "node2": 14,
                "speed": 1
            },
            "10": {
                "node1": 14,
                "node2": 15,
                "speed": 1
            },
            "11": {
                "node1": 15,
                "node2": 16,
                "speed": 1
            },
            "12": {
                "node1": 11,
                "node2": 17,
                "speed": 1
            },
            "13": {
                "node1": 12,
                "node2": 18,
                "speed": 1
            },
            "14": {
                "node1": 12,
                "node2": 19,
                "speed": 1
            },
            "15": {
                "node1": 13,
                "node2": 18,
                "speed": 1
            },
            "16": {
                "node1": 13,
                "node2": 19,
                "speed": 1
            },
            "17": {
                "node1": 13,
                "node2": 20,
                "speed": 1
            },
            "18": {
                "node1": 14,
                "node2": 19,
                "speed": 1
            },
            "19": {
                "node1": 14,
                "node2": 20,
                "speed": 1
            },
            "20": {
                "node1": 14,
                "node2": 21,
                "speed": 1
            },
            "21": {
                "node1": 15,
                "node2": 20,
                "speed": 1
            },
            "22": {
                "node1": 15,
                "node2": 21,
                "speed": 1
            },
            "23": {
                "node1": 16,
                "node2": 22,
                "speed": 1
            },
            "24": {
                "node1": 17,
                "node2": 18,
                "speed": 1
            },
            "25": {
                "node1": 18,
                "node2": 19,
                "speed": 1
            },
            "26": {
                "node1": 19,
                "node2": 20,
                "speed": 1
            },
            "27": {
                "node1": 20,
                "node2": 21,
                "speed": 1
            },
            "28": {
                "node1": 21,
                "node2": 22,
                "speed": 1
            },
            "29": {
                "node1": 17,
                "node2": 23,
                "speed": 1
            },
            "30": {
                "node1": 18,
                "node2": 24,
                "speed": 1
            },
            "31": {
                "node1": 3,
                "node2": 18,
                "speed": 0.5
            },
            "32": {
                "node1": 3,
                "node2": 19,
                "speed": 0.5
            },
            "33": {
                "node1": 3,
                "node2": 20,
                "speed": 0.5
            },
            "34": {
                "node1": 4,
                "node2": 19,
                "speed": 0.5
            },
            "35": {
                "node1": 4,
                "node2": 20,
                "speed": 0.5
            },
            "36": {
                "node1": 4,
                "node2": 21,
                "speed": 0.5
            },
            "37": {
                "node1": 21,
                "node2": 27,
                "speed": 1
            },
            "38": {
                "node1": 22,
                "node2": 28,
                "speed": 1
            },
            "39": {
                "node1": 5,
                "node2": 24,
                "speed": 0.5
            },
            "40": {
                "node1": 5,
                "node2": 25,
                "speed": 0.5
            },
            "41": {
                "node1": 5,
                "node2": 26,
                "speed": 0.5
            },
            "42": {
                "node1": 6,
                "node2": 25,
                "speed": 0.5
            },
            "43": {
                "node1": 6,
                "node2": 26,
                "speed": 0.5
            },
            "44": {
                "node1": 6,
                "node2": 27,
                "speed": 0.5
            },
            "45": {
                "node1": 23,
                "node2": 24,
                "speed": 1
            },
            "46": {
                "node1": 24,
                "node2": 25,
                "speed": 1
            },
            "47": {
                "node1": 25,
                "node2": 26,
                "speed": 1
            },
            "48": {
                "node1": 26,
                "node2": 27,
                "speed": 1
            },
            "49": {
                "node1": 27,
                "node2": 28,
                "speed": 1
            },
            "50": {
                "node1": 23,
                "node2": 29,
                "speed": 1
            },
            "51": {
                "node1": 24,
                "node2": 30,
                "speed": 1
            },
            "52": {
                "node1": 24,
                "node2": 31,
                "speed": 1
            },
            "53": {
                "node1": 25,
                "node2": 30,
                "speed": 1
            },
            "54": {
                "node1": 25,
                "node2": 31,
                "speed": 1
            },
            "55": {
                "node1": 25,
                "node2": 32,
                "speed": 1
            },
            "56": {
                "node1": 26,
                "node2": 31,
                "speed": 1
            },
            "57": {
                "node1": 26,
                "node2": 32,
                "speed": 1
            },
            "58": {
                "node1": 26,
                "node2": 33,
                "speed": 1
            },
            "59": {
                "node1": 27,
                "node2": 32,
                "speed": 1
            },
            "60": {
                "node1": 27,
                "node2": 33,
                "speed": 1
            },
            "61": {
                "node1": 28,
                "node2": 34,
                "speed": 1
            },
            "62": {
                "node1": 29,
                "node2": 30,
                "speed": 1
            },
            "63": {
                "node1": 30,
                "node2": 31,
                "speed": 1
            },
            "64": {
                "node1": 31,
                "node2": 32,
                "speed": 1
            },
            "65": {
                "node1": 32,
                "node2": 33,
                "speed": 1
            },
            "66": {
                "node1": 33,
                "node2": 34,
                "speed": 1
            },
            "67": {
                "node1": 7,
                "node2": 30,
                "speed": 0.5
            },
            "68": {
                "node1": 7,
                "node2": 31,
                "speed": 0.5
            },
            "69": {
                "node1": 7,
                "node2": 32,
                "speed": 0.5
            },
            "70": {
                "node1": 8,
                "node2": 31,
                "speed": 0.5
            },
            "71": {
                "node1": 8,
                "node2": 32,
                "speed": 0.5
            },
            "72": {
                "node1": 8,
                "node2": 33,
                "speed": 0.5
            },
            "73": {
                "node1": 9,
                "node2": 35,
                "speed": 0.5
            },
            "74": {
                "node1": 10,
                "node2": 35,
                "speed": 1
            },
            "75": {
                "node1": 9,
                "node2": 17,
                "speed": 0.5
            },
            "76": {
                "node1": 10,
                "node2": 76,
                "speed": 1
            }
        }
    }

    amrs = setup_amrs(env, map_data)
    send_missions(amrs)

    # ---------- 시뮬레이션 + 로그 출력 ----------
    step_count = 0
    while env.peek() != float('inf'):
        env.step()
        step_count += 1
        if step_count % 10 == 0:
            with LOCK:
                print(f"=== Step {step_count} ===")
                for amr_id, status in SHARED_STATUS.items():
                    print(f"""
                    {amr_id}
                      - 위치: ({status['x']:.2f}, {status['y']:.2f})
                      - 방향: {status['dir']:.1f}°
                      - 상태: {status['state']}
                      - 배터리: {status['battery']:.1f}%
                      - 미션 ID: {status.get('missionId')}
                      - 미션 타입: {status.get('missionType')}
                      - 현재 Submission ID: {status.get('submissionId')}
                      - 속도: {status.get('speed')}
                      - 자재 로딩 여부: {status.get('loaded')}
                    """)
