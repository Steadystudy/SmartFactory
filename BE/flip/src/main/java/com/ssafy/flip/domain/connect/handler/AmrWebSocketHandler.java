package com.ssafy.flip.domain.connect.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.connect.dto.request.RouteTempDTO;
import com.ssafy.flip.domain.connect.service.WebSocketService;
import com.ssafy.flip.domain.log.service.mission.MissionLogService;
import com.ssafy.flip.domain.status.dto.request.AmrSaveRequestDTO;
import com.ssafy.flip.domain.status.dto.request.MissionRequestDto;
import com.ssafy.flip.domain.status.service.StatusService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class AmrWebSocketHandler extends TextWebSocketHandler {

    @Getter
    private final Map<String, WebSocketSession> amrSessions = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final WebSocketService webSocketService;
    private final StatusService statusService;
    private final MissionLogService missionLogService;

    private final Map<String, Integer> lastSubmissionMap = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> submissionStartMap = new ConcurrentHashMap<>();
    private final Map<String, List<RouteTempDTO>> routeTempMap = new ConcurrentHashMap<>();

    private final Map<Integer, String> nodeOccupants = new ConcurrentHashMap<>();
    private final Map<Integer, Queue<String>> nodeQueues = new ConcurrentHashMap<>();
    private final Map<String, String> lastMissionMap = new ConcurrentHashMap<>();
    private final Map<String, Integer> previousNodeMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("AMR 연결 : " + session.getId());

        // WebSocketServiceImpl에서 JSON 데이터 가져옴
        String mapInfoJson = webSocketService.sendMapInfo();

        // 직접 WebSocket 세션에 메시지 전송
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(mapInfoJson));
            System.out.println("✅ Map Info 전송 완료: " + mapInfoJson);

            for(int i = 1; i <= 20; i++) {
                String amrId = String.format("AMR%03d", i);
                String missionInfoJson = webSocketService.missionAssign(amrId);
                session.sendMessage(new TextMessage(missionInfoJson));
            }

        } else {
            System.err.println("❌ WebSocket 세션이 닫혀 있음: " + session.getId());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        System.out.println(payload);
        Map<String, Object> jsonMap = objectMapper.readValue(payload, Map.class);
        Map<String, Object> header = (Map<String, Object>) jsonMap.get("header");
        String msgName = (String) header.get("msgName");

        switch (msgName) {
            case "AMR_STATE":
                handleAmrState(jsonMap, session);
                break;
            case "TRAFFIC_REQ":
                handleTrafficRequest(jsonMap);
                break;
            default:
                System.out.println("Unknown message: " + msgName);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        System.out.println("AMR 연결 종료: " + session.getId());

        // 연결이 끊긴 session과 매칭되는 amrId를 찾기
        String disconnectedAmrId = null;
        for (Map.Entry<String, WebSocketSession> entry : amrSessions.entrySet()) {
            if (entry.getValue().getId().equals(session.getId())) {
                disconnectedAmrId = entry.getKey();
                break;
            }
        }

        if (disconnectedAmrId != null) {
            amrSessions.remove(disconnectedAmrId);
            lastSubmissionMap.remove(disconnectedAmrId);
            submissionStartMap.remove(disconnectedAmrId);
            routeTempMap.remove(disconnectedAmrId);
            System.out.println("🧹 AMR 데이터 정리 완료: " + disconnectedAmrId);
        }
    }

    private void handleAmrState(Map<String, Object> json, WebSocketSession session) {
        try {
            Map<String, Object> body = (Map<String, Object>) json.get("body");
            String amrId = (String) body.get("amrId");
            amrSessions.put(amrId, session);
            AmrSaveRequestDTO amrDto = objectMapper.convertValue(json, AmrSaveRequestDTO.class);

            String missionId = amrDto.body().missionId();
            int currentSubmission = amrDto.body().submissionId();
            int nodeId = amrDto.body().currentNode();
            int edgeId = amrDto.body().currentEdge();

            if(missionId != null) {
                lastMissionMap.put(amrId, missionId);
            }
            Integer lastSubmission = lastSubmissionMap.get(amrId);

            if (lastSubmission != null && !lastSubmission.equals(currentSubmission)) {
                LocalDateTime now = LocalDateTime.now();
                routeTempMap.computeIfAbsent(amrId, k -> new ArrayList<>()).add(
                        RouteTempDTO.builder()
                                .missionId(missionId)
                                .submissionId(lastSubmission)
                                .nodeId(nodeId)
                                .edgeId(edgeId)
                                .startedAt(submissionStartMap.getOrDefault(amrId, now))
                                .endedAt(now)
                                .build()
                );
                submissionStartMap.put(amrId, now);
                lastSubmissionMap.put(amrId, currentSubmission);
            } else if (lastSubmission == null) {
                submissionStartMap.put(amrId, LocalDateTime.now());
                lastSubmissionMap.put(amrId, currentSubmission);
            }

            if (amrDto.body().state() == 1) {
                List<RouteTempDTO> routeTemps = routeTempMap.get(amrId);
                if (routeTemps != null && !routeTemps.isEmpty()) {
                    missionLogService.saveWithRoutes(amrId, missionId, routeTemps);
                    routeTempMap.remove(amrId);
                    submissionStartMap.remove(amrId);
                    lastSubmissionMap.remove(amrId);
                }
            }

            MissionRequestDto missionRequestDto = statusService.Algorithim(missionId);
            statusService.saveAmr(amrDto, missionRequestDto);

            Integer currentNode = amrDto.body().currentNode();
            Integer previousNode = previousNodeMap.put(amrId, currentNode);

            if (previousNode != null && !previousNode.equals(currentNode)) {
                if (amrId.equals(nodeOccupants.get(previousNode))) {
                    nodeOccupants.remove(previousNode);
                    Queue<String> queue = nodeQueues.get(previousNode);
                    if (queue != null && !queue.isEmpty()) {
                        String nextAmrId = queue.poll();
                        nodeOccupants.put(previousNode, nextAmrId);
                        int nextSubmissionId = lastSubmissionMap.get(nextAmrId);
                        String nextMissionId = lastMissionMap.get(nextAmrId);
                        sendTrafficPermit(nextAmrId, nextMissionId, nextSubmissionId, previousNode);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("AMR_STATE 처리 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void handleTrafficRequest(Map<String, Object> json) {
        Map<String, Object> body = (Map<String, Object>) json.get("body");
        String amrId = (String) body.get("amrId");
        int nodeId = (Integer) body.get("nodeId");
        int submissionId = (Integer) body.get("submissionId");
        String missionId = (String) body.get("missionId");

        System.out.println("\uD83D\uDEA6 TRAFFIC_REQ 수신: " + amrId + " → 노드 " + nodeId);
        nodeQueues.computeIfAbsent(nodeId, k -> new LinkedList<>());

        String currentOccupant = nodeOccupants.get(nodeId);
        if (currentOccupant == null) {
            nodeOccupants.put(nodeId, amrId);
            sendTrafficPermit(amrId, missionId, submissionId, nodeId);
        } else {
            nodeQueues.get(nodeId).add(amrId);
            System.out.println("대기열 추가됨: " + amrId + " → 노드 " + nodeId);
        }
    }

    private void sendTrafficPermit(String amrId, String missionId, int submissionId, int nodeId) {
        try {
            Map<String, Object> traffic = new HashMap<>();
            traffic.put("missionId", String.valueOf(missionId));
            traffic.put("submissionId", submissionId);
            traffic.put("nodeId", nodeId);

            WebSocketSession session = amrSessions.get(amrId);

            if (session != null && session.isOpen()) {
                String message = objectMapper.writeValueAsString(traffic);
                session.sendMessage(new TextMessage(message));
                System.out.println("✅ Traffic Permit 전송 성공: " + message);
            } else {
                System.err.println("❌ Traffic Permit 전송 실패: " + amrId + " 세션이 없음");
            }
        } catch (Exception e) {
            System.err.println("❌ Traffic Permit 전송 실패: " + e.getMessage());
        }
    }

}