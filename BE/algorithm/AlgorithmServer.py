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

def findAvailableChargingZones():
    """
    몇 번 충전구역이 사용 가능한지 구하는 함수
    예시 : [91,93] 현재 91,93번 충전 가능
    """
    ChargingZone = [False, False, False]
    for i in range(1, 21):
        key = f"AMR_STATUS:AMR{i:03}"
        if not r.exists(key):
            continue
        h = r.hgetall(key)
        if str(h.get("missionType")).upper() in ("CHARGING") and "submissionList" in h:
            try:
                submission_list = [json.loads(s) for s in json.loads(h["submissionList"])]
                submission_nodes = [s.get("submissionNode") for s in submission_list]
                if submission_nodes:
                    last_node = int(submission_nodes[-1])
                    if 91 <= last_node <= 93:
                        ChargingZone[last_node - 91] = True
            except Exception:
                pass
    return [i + 91 for i, used in enumerate(ChargingZone) if not used]

def get_charging_assignments():
    available_zones = findAvailableChargingZones()
    max_amrs = len(available_zones)

    batteryList = [
        (int(battery), f"AMR{i:03}")
        for i in range(1, 21)
        if r.exists(key := f"AMR_STATUS:AMR{i:03}")
           and (h := r.hgetall(key))
           and (battery := h.get("battery")) is not None
           and int(battery) <= 70
    ]

    # 배터리 낮은 순으로 정렬 후 상위 max_amrs개 추출
    sorted_amrs = [amr for _, amr in sorted(batteryList)[:max_amrs]]


    return available_zones, sorted_amrs


# -------------------- ① Redis → Python --------------------

def fetch_robot_list(needChargeAmrs,triggered_amr,inputMissionType) -> list[tuple[str, int, int]]:
    robot_list = []
    ban_work_list = []
        
    for i in range(1, 21):
        key = f"AMR_STATUS:AMR{i:03}"
        if not r.exists(key):
            continue
        if f"AMR{i:03}" in needChargeAmrs:
            continue
        
        h = r.hgetall(key)
        amr_id = h.get("amrId", f"AMR{i:03}")

        # submissionList가 존재할 때 처리
        if "submissionList" in h:
            try:
                submission_list = [json.loads(s) for s in json.loads(h["submissionList"])]
                # submissionNode 목록만 추출
                submission_nodes = [s.get("submissionNode") for s in submission_list]

                # currentNode가 submissionList에 있다면, 그 다음 submissionNode 사용
                if len(submission_nodes)!=0:
                    node_id = submission_nodes[int(h.get("submissionId", 0))]
                else:
                    node_id = int(h.get("currentNode"))  # 기본값
                    pass  # 그대로 current_node 유지

            except Exception as e:
                pass
        
        #loading = 1 if str(h.get("missionType", "")).upper() in ("CHARGING") else 0
        loading = 1 if str(h.get("loading", "")).lower() in ("true") else 0
        if not(1<=node_id<=10 or 21<=node_id<=30 or 41<=node_id<=50):
            if not(str(h.get("missionType", "")).upper() in ("CHARGING")):
                robot_list.append((amr_id, node_id, loading))
            else:
                if amr_id==triggered_amr and inputMissionType=="CHARGING":
                    robot_list.append((amr_id,node_id,0))
        else:
            #banlist가 잘못들어가고 있음 =꿀발라 놓는 이유
            ban_work_list.append(node_id)
            #ban_work_list.append(submission_nodes[-1])

    return robot_list,ban_work_list
        

def fetch_line_status(banlist) -> list[tuple[int, float]]:
    """
    Redis 키 MISSION_PT:11~50 에 저장된 ISO8601 문자열 → 현재시각과의 차이를 점수로 사용
    """
    now = datetime.now()
    line_status = []
    for node in range(11, 51):
        if node in banlist:
            continue
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

def print_assignment(consumer, partitions):
    print("🟢 카프카 연결 완료")



def listen_loop():
    consumer.subscribe(["algorithm-trigger"], on_assign=print_assignment)
    while True:
        msg = consumer.poll(1.0)
        if msg is None or msg.error():
            continue

        raw_value = msg.value().decode("utf-8").strip()

        # ✅ 케이스 1: "simulator start"
        if raw_value.lower() == "simulator start":
            print("🚀 [Simulator Start] 알고리즘 강제 실행")
            triggered_amr = None
            cancelled_amrs = []
            inputMissionType = "START"
        
        # ✅ 케이스 2: JSON payload
        elif raw_value.startswith("{"):
            try:
                payload = json.loads(raw_value)
            except Exception as e:
                print(f"❌ JSON 파싱 실패: {e}")
                continue

            triggered_amr = payload.get("amrId")
            cancelled_amrs = payload.get("cancelledAmrs", [])
            inputMissionType = payload.get("missionType")
            print("미션 완료 {} 미션 타입 {}",triggered_amr,inputMissionType)

            if not triggered_amr:
                print("⚠️ triggered_amr 없음 → 알고리즘 실행 생략")
                continue


        # ✅ 예외: 알 수 없는 형식
        else:
            print(f"⚠️ 비정형 메시지 무시됨: {raw_value}")
            continue


        # ✅ 알고리즘 실행 부분 공통

        zones, amrs = get_charging_assignments() # zones : 충전 가능한 구역,amrs : 현재 충전 해야하는 amr 기기 번호
        print("충전 구역 {} 충전 해야하는 기기들 {}",zones,amrs)
        robot,banlist   = fetch_robot_list(amrs,triggered_amr,inputMissionType)
        print("일 할 로봇 {} 금지구역 {}",robot,banlist)
        jobs    = fetch_line_status(banlist)
        assign  = api.assign_tasks(robot, jobs)
        """ 충전 친구들도 넣어야함 """

        # 추가 조건 필터링: CHARGING 미션이거나 loading == true인 경우 제외
        charge_amrs = []
        for amr_id in amrs:
            key = f"AMR_STATUS:{amr_id}"
            h = r.hgetall(key)
            mission_type = str(h.get("missionType", "")).upper()
            loading = str(h.get("loading", "")).lower()
            if mission_type == "CHARGING" or loading == "true":
                continue  # 제외 조건
            charge_amrs.append(amr_id)
        chargeStartNode=[]
        for amr_id in charge_amrs:
            key = f"AMR_STATUS:{amr_id}"
            h = r.hgetall(key)
            if str(h.get("loading", "")).lower() in ("true"):
                continue
            if "submissionList" in h:
                try:
                    submission_list = [json.loads(s) for s in json.loads(h["submissionList"])]
                    # submissionNode 목록만 추출
                    submission_nodes = [s.get("submissionNode") for s in submission_list]

                    # currentNode가 submissionList에 있다면, 그 다음 submissionNode 사용
                    if len(submission_nodes)!=0:
                        node_id = submission_nodes[int(h.get("submissionId", 0))]
                    else:
                        node_id = int(h.get("currentNode"))  # 기본값
                        pass  # 그대로 current_node 유지

                except Exception as e:
                    pass
            chargeStartNode.append(node_id)

        chargeResult = api.assign_charging_spots(chargeStartNode, zones,amrs)
        


        all_results = []
        assign.extend(chargeResult)
        for (amr_id, _, _), (dest, _), mission_type, path, cost in assign:
            if cost >= 900 or path is None:
                print(cost," 코스트 넘치거나",path,"경로가 없음")
                continue

            # firstNode=path[0]
            # if 1<=firstNode<=10 or 21<=firstNode<=30 or 41<=firstNode<=50:
            #     key = f"AMR_STATUS:{amr_id}"
            #     h = r.hgetall(key)
            #     current_node = int(h.get("currentNode", 0))
            #     path.insert(0, current_node)

            key = f"AMR_STATUS:{amr_id}"
            h = r.hgetall(key)
            
            if "submissionList" in h:
                # try:
                    raw_value = h["submissionList"]
                    raw_list = json.loads(raw_value)

                    submission_list = []
                    for s in raw_list:
                        if isinstance(s, str):
                            try:
                                parsed = json.loads(s)
                                submission_list.append(parsed)
                            except Exception:
                                continue
                        elif isinstance(s, dict):
                            submission_list.append(s)
                        elif isinstance(s, int):
                            submission_list.append({"submissionNode": s})

                    submission_nodes = [s.get("submissionNode") for s in submission_list if s.get("submissionNode") is not None]
                    #print(amr_id)
                    if int(h.get("submissionId"))==0:
                        pass
                        #print(f"현재 노드,다음 목적지 노드 , 서브 미션 노드 , 서브미션ID",int(h.get("currentNode", 0)),int(h.get("currentNode", 0)),submission_nodes,int(h.get("submissionId", 0)))
                    else:
                        pass
                        #print(f"현재 노드,다음 목적지 노드 , 서브 미션 노드 , 서브미션ID",int(h.get("currentNode", 0)),submission_nodes[int(h.get("submissionId", 0))],submission_nodes,int(h.get("submissionId", 0)))
                    if len(submission_list)!=0:
                        submission_nodes = submission_nodes[:int(h.get("submissionId", 0))]
                    #if amr_id==f"AMR{testNumber:03}":
                    # print("이전 서브리스트",submission_nodes)
                    # print("알고리즘 서버 정답 :",path)
                    if len(submission_nodes)!=0 and submission_nodes[-1] == path[0]:
                        path=submission_nodes[:-1]+path
                    else:
                        path=submission_nodes+path
                    #if amr_id==f"AMR{testNumber:03}":
                    # print("최종 루트",path)

                # except Exception as e:
                #     print("❌ 이어붙이기 실패:")
                #     print("   ➤ 에러 타입:", type(e))
                #     print("   ➤ 에러 이름:", e.__class__.__name__)
                #     print("   ➤ 에러 메시지:", str(e))


            result = {
                "amrId"  : amr_id,
                "missionId": f"MISSION{int(dest):03}",
                "missionType" : mission_type,
                "route"  : path,
                "expectedArrival" : int(cost)
            }
            all_results.append(result)
            print("결과",result)

        
        print("")
        if all_results:
            payload = {
                "triggeredAmr": triggered_amr,  # None 일 수도 있음
                "missions": all_results
            }
            producer.produce("algorithm-result", json.dumps(payload))
            producer.flush()
            #print(f"📤 Kafka 전송 완료 (trigger: {triggered_amr})")



testNumber=15
if __name__ == "__main__":
    #api.mapInit()
    listen_loop()
