package com.ssafy.flip.domain.connect.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ssafy.flip.domain.connect.dto.response.EdgeDTO;
import com.ssafy.flip.domain.connect.dto.response.MapInfoDTO;
import com.ssafy.flip.domain.connect.dto.response.NodeDTO;
import com.ssafy.flip.domain.mission.dto.MissionResponse;
import com.ssafy.flip.domain.node.entity.Edge;
import com.ssafy.flip.domain.node.entity.Node;
import com.ssafy.flip.domain.node.service.edge.EdgeService;
import com.ssafy.flip.domain.node.service.node.NodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketServiceImpl implements WebSocketService {

    private final ObjectMapper objectMapper;
    private final NodeService nodeService;
    private final EdgeService edgeService;

    // 🔧 AmrWebSocketHandler를 제거하고 세션 Map 직접 관리
    private final Map<String, WebSocketSession> amrSessions = new ConcurrentHashMap<>();

    @Override
    public void registerSession(String amrId, WebSocketSession session) {
        amrSessions.put(amrId, session);
        log.info("✅ WebSocket 세션 등록됨: {}", amrId);
    }

    @Override
    public String sendMapInfo() {
        List<Node> nodeList = nodeService.findAll();
        List<Edge> edgeList = edgeService.findAll();

        // DTO 변환
        List<NodeDTO> nodeDTOs = nodeList.stream()
                .map(NodeDTO::from)
                .toList();

        List<EdgeDTO> edgeDTOs = edgeList.stream()
                .map(EdgeDTO::from)
                .toList();

        // MapInfo 생성
        MapInfoDTO mapInfoDTO = MapInfoDTO.of(nodeDTOs, edgeDTOs);

        // JSON 직렬화
        try {
            return objectMapper.writeValueAsString(mapInfoDTO);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("맵 정보 직렬화 실패", e);
        }
    }


    @Override
    public String missionAssign(String amrId) {
        String dummyJson = """
                {
                   "header": {
                      "msgName": "MISSION_ASSIGN",
                      "time": "2025-05-02 14:25:10.000",
                      "amrId": "%s"
                   },
                   "body": {
                      "missionId":"mission001",
                      "missionType":"moving",
                      "submissions":[
                         {
                            "submissionId":1,
                            "nodeId":1,
                            "edgeId":10
                         },
                         {
                            "submissionId":2,
                            "nodeId":2,
                            "edgeId":1
                         },
                         {
                            "submissionId":3,
                            "nodeId":9,
                            "edgeId":18
                         }
                      ]
                   }
                }
                """.formatted(amrId);

        return dummyJson;
    }

    @Value("simulator.url")
    String url;
    public void sendMission(String amrId, MissionResponse res) {
        try {
            List<Integer> route = res.getRoute();
            List<ObjectNode> submissions = new ArrayList<>();

            for (int i = 1; i < route.size(); i++) {
                int prev = route.get(i - 1);
                int curr = route.get(i);

                int node1 = Math.min(prev, curr);
                int node2 = Math.max(prev, curr);
                String edgeKey = node1 + "-" + node2;

                String edgeId = edgeService.getEdgeKeyToIdMap().getOrDefault(edgeKey, "UNKNOWN");

                ObjectNode submission = objectMapper.createObjectNode();
                submission.put("submissionId", String.valueOf(i));  // 1부터 시작
                submission.put("nodeId", String.valueOf(curr));     // 현재 노드
                submission.put("edgeId", edgeId);                   // 엣지 ID

                submissions.add(submission);
            }

            ObjectNode header = objectMapper.createObjectNode();
            header.put("msgName", "MISSION_ASSIGN");
            header.put("time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS")));
            header.put("amrId", amrId);

            ObjectNode body = objectMapper.createObjectNode();
            body.put("missionId", String.valueOf(res.getMission()));
            body.put("missionType", "MOVING");
            body.set("submissions", objectMapper.valueToTree(submissions));

            ObjectNode root = objectMapper.createObjectNode();
            root.set("header", header);
            root.set("body", body);

            String payload = objectMapper.writeValueAsString(root);
            System.out.println("payload는 이값입니다 : "+payload);
            WebSocketSession session = amrSessions.get(url);

            if (session != null && session.isOpen()) {
                session.sendMessage(new TextMessage(payload));
                log.info("📤 미션 전송 완료: AMR = {}, Payload = {}", amrId, payload);
            } else {
                log.warn("❗ WebSocket 세션 없음: AMR = {}", amrId);
            }

        } catch (Exception e) {
            log.error("❗ sendMission 전송 실패", e);
        }
    }
}
