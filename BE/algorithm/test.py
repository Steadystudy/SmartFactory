import redis, os, json,api

KAFKA_HOST = os.getenv('KAFKA_HOST', "localhost")
r = redis.Redis(host=KAFKA_HOST, port=6379, decode_responses=True)

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
        if str(h.get("missionType")).upper() in ("UNLOADING", "CHARGING") and "submissionList" in h:
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
    selected_amrs = [amr for _, amr in sorted(batteryList)[:max_amrs]]
    return available_zones, selected_amrs

def assign_charging_spots(chargeStartNode, zones,amrs):
    assigned_zones = []
    results = []

    for index,start in enumerate(chargeStartNode):
        
        best_path = None
        best_time = float('inf')
        best_zone = None

        for zone in zones:
            if zone in assigned_zones:
                continue

            path, cost = api.aStar(start, zone)
            if cost < best_time:
                best_path = path
                best_time = cost
                best_zone = zone

        if best_zone is not None:
            assigned_zones.append(best_zone)
            node_only_best_path = [node for node, _ in best_path]
            results.append(((amrs[index], "dummy", "dummy"), (best_zone, "dummy"), "Charging", node_only_best_path, best_time))

    return results

# 예시 출력
zones, amrs = get_charging_assignments()
print(zones)
print(amrs)
assign=[]
chargeStartNode=[]
for amr_id in amrs:
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

chargeResult = assign_charging_spots(chargeStartNode, zones,amrs)


for (amr_id, _, _), (dest, _), mission_type, path, cost in chargeResult:
    print((amr_id, _, _), (dest, _), mission_type, path, cost)