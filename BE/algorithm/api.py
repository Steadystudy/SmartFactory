from scipy.optimize import linear_sum_assignment
import heapq
import math
import json
import random
import numpy as np

def mapInit():
    # 2. 맵데이터 읽기 (노드 정보)
    with open('algorithm/맵데이터.txt', 'r', encoding='utf-8') as file:
        buffer = ''
        for line in file:
            buffer += line.strip()
            if buffer.endswith('}'):
                block = json.loads(buffer.replace('null', 'null'))
                nodes[block['ID']] = block
                buffer = ''

    # 3. 엣지데이터 읽기 (엣지 정보)
    with open('algorithm/edge.txt', 'r', encoding='utf-8') as file:
        buffer = ''
        for line in file:
            buffer += line.strip()
            if buffer.endswith('}'):
                block = json.loads(buffer.replace('null', 'null'))
                edges.append(block)
                buffer = ''

    # 4. 그래프 생성

    for edge in edges:
        node1 = edge['node1']
        node2 = edge['node2']
        direction = edge['direction']
        speed = edge['speed']

        # 거리 계산 (x, y 좌표 필요)
        x1, y1 = nodes[node1]['x'], nodes[node1]['y']
        x2, y2 = nodes[node2]['x'], nodes[node2]['y']
        distance = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

        # 원하는 가중치 설정
        weight = distance  # 또는 speed  (여기선 '거리'를 weight로 쓴다)

        # 양방향 연결이면 둘 다 추가
        if direction == 'twoway':
            graph.setdefault(node1, []).append((node2, weight))
            graph.setdefault(node2, []).append((node1, weight))
        elif direction == 'forward':
            graph.setdefault(node1, []).append((node2, weight))
        elif direction == 'rearward':
            graph.setdefault(node2, []).append((node1, weight))
        else:
            print(direction)
            raise ValueError(f"Unknown direction: {direction}")

def aStar(start, end):
    if end>=1000:
        return None , 0
    open_set = []  # (f_score, node) 저장하는 heap
    heapq.heappush(open_set, (0, start))

    came_from = {}  # 최단 경로를 복구하기 위한 dict
    g_score = {start: 0}  # 시작 노드까지의 실제 거리

    while open_set:
        current_f, current = heapq.heappop(open_set)

        if current == end:
            # 경로 복구
            path = [current]
            while current in came_from:
                current = came_from[current]
                path.append(current)
            path.reverse()
            return path, g_score[end]  # 경로, 최단 거리

        for neighbor, weight in graph.get(current, []):
            tentative_g = g_score[current] + weight

            if neighbor not in g_score or tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score = tentative_g + heuristic(neighbor, end)
                heapq.heappush(open_set, (f_score, neighbor))

    # 경로 없음
    return None, float('inf')

# 휴리스틱 함수 (유클리드 거리)
def heuristic(node1, node2):
    x1, y1 = nodes[node1]['x'], nodes[node1]['y']
    x2, y2 = nodes[node2]['x'], nodes[node2]['y']
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

# ---------- 작업별 적재(1) / 비적재(0) 요구 ----------
def needs_load(task_id: int) -> bool:
    return 11 <= task_id <= 20 or 31 <= task_id <= 40          # 적재 必

def needs_unload(task_id: int) -> bool:
    return 21 <= task_id <= 30 or 41 <= task_id <= 50          # 비적재 必


# ---------- 로봇‑작업 1쌍에 대한 비용·경로 계산 ----------
PICKUP_NODES = (101, 124, 114)          # 적재 지점 3곳
EXTRA_PICKUP_COST = 6                   # 적재 소요 시간(코스트)

def calc_cost_and_route(start_node: int,
                        loaded: int,
                        task_dest: int) -> tuple[list[int] | None, float]:
    """start_node: 현재 로봇 위치, loaded: 0/1, task_dest: 목적지 노드"""
    # 더미 작업(1000 이상)은 0 코스트
    if task_dest >= 1000:
        return [start_node], 0.0

    # ① 상태가 이미 만족되는 경우 → 그냥 A*
    if (loaded == 1 and needs_load(task_dest)) or \
       (loaded == 0 and needs_unload(task_dest)) or \
       (not needs_load(task_dest) and not needs_unload(task_dest)):
        return aStar(start_node, task_dest)

    # ② (0 → 1) 적재가 필요한데 현재 비적재인 경우
    if loaded == 0 and needs_load(task_dest):
        best_cost = float("inf")
        best_route = None
        for p in PICKUP_NODES:
            r1, c1 = aStar(start_node, p)
            r2, c2 = aStar(p, task_dest)
            if not r1 or not r2:
                continue
            total = c1 + c2 + EXTRA_PICKUP_COST
            if total < best_cost:
                best_cost = total
                best_route = r1[:-1] + r2       # 중복 노드(픽업 지점) 제거
        return best_route, best_cost

    # ③ (1 → 0) 비적재 작업인데 현재 적재인 경우 → 할 수 없음(∞ 비용)
    return None, 999


# ---------- 헝가리안 알고리즘 ----------
def hungarian(robotList, taskList):
    n, m = len(robotList), len(taskList)
    if n > m:                                # 더미 작업 보충
        for k in range(n - m):
            taskList.append((1000 + k, 0))
    taskList = taskList[:n]

    cost_matrix = np.zeros((n, n))
    routes = [[None]*n for _ in range(n)]

    for i in range(n):
        _,start_node, loaded = robotList[i]     # 위치, 적재 여부
        for j in range(n):
            dest, _ = taskList[j]
            r, c = calc_cost_and_route(start_node, loaded, dest)
            routes[i][j] = r
            cost_matrix[i][j] = c

    # 헝가리안 수행 (불가능 매칭은 ∞ 비용으로 자동 제외)
    row_ind, col_ind = linear_sum_assignment(cost_matrix)

    # 결과 출력 (∞ 비용은 매칭에서 빠짐)
    total = 0
    print("\n🔗 매칭 결과")
    for i, j in zip(row_ind, col_ind):
        robot_name,robot_id, loaded = robotList[i]
        dest, score = taskList[j]
        cost = cost_matrix[i][j]
        path = routes[i][j]
        if math.isinf(cost):
            print(f"❌ 로봇 {robot_id} → 작업 {dest} (불가능)")
            continue
        total += cost
        state = "적재" if loaded else "비적재"
        print(f"🦾 로봇{robot_name} 노드:{robot_id}({state}) → 작업 {dest} | 거리 {cost:.2f}")
        print(f"   📍 경로: {path}")

    print(f"\n✅ 총 거리 비용: {total:.2f}")
    return [(robotList[i], taskList[j], routes[i][j], cost_matrix[i][j])
            for i, j in zip(row_ind, col_ind)], total

# --- 맨 아래의 “demo 코드” 삭제 -----------------------------
# robot = 20
# ...
# result = hungarian(robotList, taskList)
# -----------------------------------------------------------

# 대신 함수로 노출
def assign_tasks(robot_list: list[tuple[str, int, int]],
                 line_status: list[tuple[int, float]]):
    """
    robot_list  = [(amrId, currentNode, loading(0/1)), ...]
    line_status = [(nodeId, score), ...]   # 점수 = 남은 작업 ‘긴급도’ 등
    """
    # score 기준 내림차순 정렬
    task_list = sorted(line_status, key=lambda x: x[1], reverse=True)

    assignments, _ = hungarian(robot_list, task_list)
    return assignments            # [(robotTuple, taskTuple, path, cost), ...]


nodes = {}
edges = []
graph = {}

# # #맵 생성
# mapInit()
# #astar알고리즘(현재 가고있는 노드,시작노드,끝점)
# print(aStar(11,51))
# #현재 가동 가능한 로봇수
# robot=20
# excluded_ids = {204, 205, 212, 213, 220, 221, 228, 229}
# robot_candidates = [i for i in list(range(1, 61)) + list(range(101, 233)) if i not in excluded_ids]
# #(현재 위치 , 0은 적재안함 1은 적재상태 , 
# robotList = [(robotName,rid, random.randint(0, 1)) for robotName,rid in enumerate(random.sample(robot_candidates, k=robot))]
# lineStatus = random.sample(range(1, 61), 40)
# print(lineStatus)
# taskList = [(idx+11,val) for idx,val in enumerate(lineStatus) if val >= 28]
# taskList.sort(key=lambda x: x[1], reverse=True)
# #로봇의 현재 노드 위치[20개], 일의의
# result=hungarian(robotList,taskList)