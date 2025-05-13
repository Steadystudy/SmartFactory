from confluent_kafka import Consumer, Producer
import json, redis, api, time, os
import redis, json, time
from datetime import datetime, timezone, timedelta
import random
import api   # 같은 디렉터리의 api.py 임포트
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()
KAFKA_HOST = os.getenv('KAFKA_HOST',"localhost")
KAFKA_BOOT = os.getenv("KAFKA_BOOT", "localhost:9092")
# -------------------- ① Redis → Python --------------------
def fetch_robot_list() -> list[tuple[str, int, int]]:
    robot_list = []
    for i in range(1, 21):
        key = f"AMR_STATUS:AMR{i:03}"
        if not r.exists(key):
            continue

        h = r.hgetall(key)
        amr_id   = h["amrId"] if "amrId" in h else f"AMR{i:03}"
        node_id  = int(h.get("currentNode", 0))           # 없으면 0

        # excluded_ids = {204, 205, 212, 213, 220, 221, 228, 229}
        # robot_candidates = [i for i in list(range(1, 61)) + list(range(101, 233)) if i not in excluded_ids]
        # node_id=random.sample(robot_candidates, k=1)[0]

        loading = 1 if str(h.get("missionType", "")).upper() in ("LOADING", "CHARGING") else 0
        robot_list.append((amr_id, node_id, loading))
    return robot_list


def fetch_line_status() -> list[tuple[int, float]]:
    """
    Redis 키 MISSION_PT:11~50 에 저장된 ISO8601 문자열 → 현재시각과의 차이를 점수로 사용
    """
    now = datetime.now()
    line_status = []
    for node in range(11, 51):
        key = f"MISSION_PT:{node}"
        if r.exists(key):
            ts_str = r.get(key)
            try:
                ts = datetime.fromisoformat(ts_str)
                elapsed = (now - ts).total_seconds()
                if 11<=node<=20 or 31<=node<=40:
                    elapsed += api.loadingTimeTable[(node-1)%10+1][node]
                line_status.append((node, elapsed))
            except Exception as e:
                print(f"⚠️ {key} 값 변환 실패: {ts_str} ({e})")
    return line_status


# -------------------- ② 알고리즘 실행 --------------------


consumer = Consumer({
    "bootstrap.servers": KAFKA_BOOT,
    "group.id": "algorithm-grp",
    "auto.offset.reset": "latest",         # 최신 메시지만
    "enable.auto.commit": True             # ✅ 자동 커밋
})

producer = Producer({"bootstrap.servers": KAFKA_BOOT})

r = redis.Redis(host=KAFKA_HOST, port=6379, decode_responses=True)

def publish_result(result: dict):
    print("결과")
    print(result)
    producer.produce("algorithm-result", json.dumps(result))
    producer.flush()

def print_assignment(consumer, partitions):
    print("🟢 카프카 연결 완료")



def listen_loop():
    consumer.subscribe(["algorithm-trigger"], on_assign=print_assignment)
    while True:
        msg = consumer.poll(1.0)
        if msg is None or msg.error():
            continue
        print("✅ Received:", msg.value().decode('utf-8'))

        # ---------------- 알고리즘 실행 ----------------
        robot   = fetch_robot_list()
        jobs    = fetch_line_status()
        assign  = api.assign_tasks(robot, jobs)

        all_results = []  # ✅ 전체 결과 리스트 초기화

        for (amr_id, _, _), (dest, _), type, path, cost in assign:
            if cost >= 900 or path is None:
                continue
            result = {
                "amrId"  : amr_id,
                "missionId": f"MISSION{int(dest):03}",  # 예: dest=80 → "MISSION080"
                "missionType" : type, #미션 타입 "MOVING", "CHARGING"...
                "route"  : path,
                "expectedArrival" : int(cost)
            }
            all_results.append(result)
        print(all_results)
        if all_results:  # ✅ 1개의 메시지로 전송
            producer.produce("algorithm-result", json.dumps(all_results))
            producer.flush()


if __name__ == "__main__":
    #api.mapInit()
    listen_loop()
