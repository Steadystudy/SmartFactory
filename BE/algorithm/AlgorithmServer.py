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
                pass
        if i == testNumber:
            print("계산전 current 와 노드 id 와",current_node,node_id,int(h.get("submissionId", 0)))

        loading = 1 if str(h.get("missionType", "")).upper() in ("UNLOADING", "CHARGING") else 0
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

        raw_value = msg.value().decode('utf-8')
        print("✅ Received:", repr(raw_value))

        # ✅ JSON 형식 아님 → 단순 문자열일 수 있음
        if not raw_value.strip().startswith("{"):
            if raw_value.strip().lower() == "simulator start":
                print("🚀 [Simulator Start] 알고리즘 강제 실행")
                triggered_amr = None  # 트리거 AMR 없음
                # ↓ 아래에서 알고리즘 실행하게 그대로 내려감
            else:
                print(f"⚠️ 비정형 메시지 수신 (무시됨): {raw_value}")
                continue
        else:
            # ✅ JSON 메시지 처리
            try:
                payload = json.loads(raw_value)
            except Exception as e:
                print(f"❌ 메시지 파싱 실패: {e}")
                continue

            msg_name = payload.get("header", {}).get("msgName", "").upper().replace(" ", "_")
            if msg_name == "SIMULATOR_START":
                print("🚀 [SIMULATOR_START] 알고리즘 강제 실행")
                triggered_amr = None  # 트리거 AMR 없음
            else:
                triggered_amr = payload.get("body", {}).get("amrId", None)
                if triggered_amr:
                    print(f"🎯 Triggered AMR: {triggered_amr}")
                else:
                    print("⚠️ triggered AMR ID가 없음 → 알고리즘 실행 생략")
                    continue

        # ✅ 알고리즘 실행 부분 공통
        robot   = fetch_robot_list()
        jobs    = fetch_line_status()
        assign  = api.assign_tasks(robot, jobs)

        all_results = []
        for (amr_id, _, _), (dest, _), type, path, cost in assign:
            if cost >= 900 or path is None:
                continue
            result = {
                "amrId"  : amr_id,
                "missionId": f"MISSION{int(dest):03}",
                "missionType" : type,
                "route"  : path,
                "expectedArrival" : int(cost)
            }
            all_results.append(result)

        print("📦 전체 미션 결과:")
        for r in all_results:
            print(r)

        if all_results:
            payload = {
                "triggeredAmr": triggered_amr,  # None 일 수도 있음
                "missions": all_results
            }
            producer.produce("algorithm-result", json.dumps(payload))
            producer.flush()
            print(f"📤 Kafka 전송 완료 (trigger: {triggered_amr})")



testNumber=9
if __name__ == "__main__":
    #api.mapInit()
    listen_loop()
