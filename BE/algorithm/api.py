from scipy.optimize import linear_sum_assignment
import heapq
import math
import json
import random
import numpy as np

def mapInit():

    # 2. 맵데이터 읽기 (노드 정보)
    with open('맵데이터.txt', 'r', encoding='utf-8') as file:
        buffer = ''
        for line in file:
            buffer += line.strip()
            if buffer.endswith('}'):
                block = json.loads(buffer.replace('null', 'null'))
                nodes[block['ID']] = block
                buffer = ''

    # 3. 엣지데이터 읽기 (엣지 정보)
    with open('edge.txt', 'r', encoding='utf-8') as file:
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


def hungarian(robotList, taskList):
    n = len(robotList)
    m = len(taskList)
    
    if n > m:
        dummy_cnt = n - m
        for i in range(dummy_cnt):
            taskList.append((f"DUMMY_{i+1}", 0))  # dummy 작업 ID, 점수 0
        print(f"⚠️ 작업이 부족하여 dummy 작업 {dummy_cnt}개를 추가했습니다.")
    
    taskList = taskList[:n]  # 길이 일치
    print("📝 taskList (작업 ID, 점수):", taskList)

    # 1. 비용 행렬 생성 (aStar 기반)
    cost_matrix = np.zeros((n, n))
    routes = [[None]*n for _ in range(n)]  # 경로 저장용

    for i in range(n):
        for j in range(n):
            route, cost = aStar(robotList[i], taskList[j][0])  # taskList[j][0]: 작업 ID
            cost_matrix[i][j] = cost
            routes[i][j] = route

    # 2. 헝가리안 알고리즘 수행
    row_ind, col_ind = linear_sum_assignment(cost_matrix)

    # 3. 결과 매칭, 거리 및 경로 포함 출력
    total_cost = 0
    print("\n🔗 매칭 결과:")
    for i, j in zip(row_ind, col_ind):
        robot_id = robotList[i]
        task_id, score = taskList[j]
        path = routes[i][j]
        cost = cost_matrix[i][j]
        total_cost += cost

        print(f"🦾 로봇 {robot_id} → 작업 {task_id} (점수: {score})")
        print(f"   📍 경로: {path}")
        print(f"   📏 거리: {cost:.2f}\n")

    print(f"✅ 총 거리 비용: {total_cost:.2f}")

    # 선택적으로 assignments도 리턴 가능
    assignments = [(robotList[i], taskList[j], routes[i][j], cost_matrix[i][j]) for i, j in zip(row_ind, col_ind)]
    return assignments, total_cost

nodes = {}
edges = []
graph = {}

#맵 생성
mapInit()
#astar알고리즘(현재 가고있는 노드,시작노드,끝점)
#print(aStar(11,51))
#현재 가동 가능한 로봇수
robot=20
excluded_ids = {204, 205, 212, 213, 220, 221, 228, 229}
robot_candidates = [i for i in list(range(1, 61)) + list(range(101, 233)) if i not in excluded_ids]
robotList = random.sample(robot_candidates, k=20)
lineStatus = random.sample(range(1, 61), 40)
print(lineStatus)
taskList = [(idx+11,val) for idx,val in enumerate(lineStatus) if val >= 28]
taskList.sort(key=lambda x: x[1], reverse=True)
#로봇의 현재 노드 위치[20개], 일의의
result=hungarian(robotList,taskList)
#로봇리스트([1,2,5,47,8,7,8,9,1,0,1,2,5,5].[max:40개고(,마지막 호출시간)])