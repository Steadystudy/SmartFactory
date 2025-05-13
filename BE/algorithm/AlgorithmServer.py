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
import json

def fetch_robot_list() -> list[tuple[str, int, int]]:
    robot_list = []
    for i in range(1, 21):
        key = f"AMR_STATUS:AMR{i:03}"
        if not r.exists(key):
            continue

        h = r.hgetall(key)
        amr_id = h.get("amrId", f"AMR{i:03}")
        current_node = int(h.get("currentNode", 0))
        node_id = current_node  # 기본값

        # submissionList가 존재할 때 처리
        if "submissionList" in h:
            try:
                submission_list = [json.loads(s) for s in json.loads(h["submissionList"])]
                # submissionNode 목록만 추출
                submission_nodes = [s.get("submissionNode") for s in submission_list]

                # currentNode가 submissionList에 있다면, 그 다음 submissionNode 사용
                if current_node in submission_nodes:
                    idx = submission_nodes.index(current_node)
                    if idx + 1 < len(submission_nodes):
                        node_id = int(submission_nodes[idx + 1])
                else:
                    # currentNode가 목록에 없을 경우 → 처음 submissionNode 유지 (또는 그대로)
                    pass  # 그대로 current_node 유지

            except Exception as e:
                print(f"⚠️ submissionList 파싱 오류 (AMR{i:03}): {e}")
        if i == testNumber:
            print("계산전 current 와 노드 id",current_node,node_id)

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
            ts_raw = r.get(key)
            ts_str = ts_raw.decode() if isinstance(ts_raw, bytes) else str(ts_raw)
            ts_str = ts_str.strip('"')  # 큰따옴표 제거

            if ts_str == "-1" or ts_str == -1:
                continue

            try:
                ts = datetime.fromisoformat(ts_str)
                elapsed = (now - ts).total_seconds()
                if 11 <= node <= 20 or 31 <= node <= 40:
                    elapsed += api.loadingTimeTable[(node - 1) % 10 + 1][node]
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
            if amr_id=="AMR0"+str(testNumber):
                h = r.hgetall("AMR_STATUS:AMR0"+str(testNumber))
                print("현재 current노드",h.get("currentNode", 0))
                print(result)
        #print(all_results)
        if all_results:  # ✅ 1개의 메시지로 전송
            producer.produce("algorithm-result", json.dumps(all_results))
            producer.flush()

testNumber=16
if __name__ == "__main__":
    #api.mapInit()
    listen_loop()
