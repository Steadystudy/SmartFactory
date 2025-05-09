package com.ssafy.flip.domain.connect.handler;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.connect.dto.request.RouteTempDTO;
import com.ssafy.flip.domain.connect.service.AlgorithmTriggerProducer;
import com.ssafy.flip.domain.connect.service.WebSocketService;
import com.ssafy.flip.domain.log.service.mission.MissionLogService;
import com.ssafy.flip.domain.status.dto.request.AmrSaveRequestDTO;
import com.ssafy.flip.domain.status.dto.request.MissionRequestDto;
import com.ssafy.flip.domain.status.service.StatusService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AmrWebSocketHandler extends TextWebSocketHandler {

    @Getter
    private final Map<String, WebSocketSession> amrSessions = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final WebSocketService webSocketService;
    private final StatusService statusService;
    private final MissionLogService missionLogService;
    private final AlgorithmTriggerProducer trigger;   // ← Kafka로 트리거

    private final Map<String, Integer> lastSubmissionMap = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> submissionStartMap = new ConcurrentHashMap<>();
    private final Map<String, List<RouteTempDTO>> routeTempMap = new ConcurrentHashMap<>();

    private final Map<Integer, String> nodeOccupants = new ConcurrentHashMap<>();
    private final Map<Integer, Queue<String>> nodeQueues = new ConcurrentHashMap<>();
    private final Map<String, String> lastMissionMap = new ConcurrentHashMap<>();
    private final Map<String, Integer> previousNodeMap = new ConcurrentHashMap<>();

    private static final DateTimeFormatter fmt =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS");

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("AMR 연결 : " + session.getId());
        // WebSocketServiceImpl에서 JSON 데이터 가져옴
        String mapInfoJson = webSocketService.sendMapInfo();
        session.sendMessage(new TextMessage(mapInfoJson));

        // 직접 WebSocket 세션에 메시지 전송
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(mapInfoJson));
            System.out.println("✅ Map Info 전송 완료: " + mapInfoJson);
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
                handleTrafficRequest(jsonMap, session);
                break;
            case "SIMULATION_START":
                handleStimulatorStart();
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

    private void handleStimulatorStart(){
        String kafkaPayload = "Simulator Start";
        try {
            Thread.sleep(1000); // 1초 대기
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // 인터럽트 플래그 복구
            e.printStackTrace();
        }
        trigger.run(kafkaPayload);  // Kafka: algorithm-trigger, 메시지는 전체 AMR 상태
    }

    private void handleAmrState(Map<String, Object> json, WebSocketSession session) {
        try {
            Map<String, Object> body = (Map<String, Object>) json.get("body");
            String amrId = (String) body.get("amrId");
            amrSessions.put(amrId, session);

            log.info("✅ WebSocket 세션 등록됨: {}", amrId);
            webSocketService.registerSession(amrId, session);

            AmrSaveRequestDTO amrDto = objectMapper.convertValue(json, AmrSaveRequestDTO.class);

            String missionId = amrDto.body().missionId();
            int currentSubmission = amrDto.body().submissionId();
            int nodeId = amrDto.body().currentNode();
            int edgeId = amrDto.body().currentEdge();

            //미션 수행 중이면 저장
            if(missionId != null) {
                lastMissionMap.put(amrId, missionId);
            }
            Integer lastSubmission = lastSubmissionMap.get(amrId);

            //서브미션이 바뀌면 서브미션이 끝난 것이므로 routeTempMap에 임시 저장
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
            } else if (lastSubmission == null) { //서브미션이 NULL이라면 미션 수행중이 아님
                submissionStartMap.put(amrId, LocalDateTime.now());
                lastSubmissionMap.put(amrId, currentSubmission);
            }

            //미션이 끝났다면 state가 1이므로 저장된 routeTempMap이 있다면 db에 저장
            if (amrDto.body().state() == 1) {
                List<RouteTempDTO> routeTemps = routeTempMap.get(amrId);
                if (routeTemps != null && !routeTemps.isEmpty()) {
                    missionLogService.saveWithRoutes(amrId, missionId, routeTemps);
                    routeTempMap.remove(amrId);
                    submissionStartMap.remove(amrId);
                    lastSubmissionMap.remove(amrId);

                    /// 내가 추가해줘야하는곳 ( 미션이 끝나는곳)
                    String kafkaPayload = objectMapper.writeValueAsString(amrDto);
                    trigger.run(kafkaPayload);  // Kafka: algorithm-trigger, 메시지는 전체 AMR 상태
                }
            }

            List<RouteTempDTO> temps = routeTempMap.getOrDefault(amrId, Collections.emptyList());
            List<String> routeListJson = temps.stream()
                    .map(dto -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("routeId",   dto.getSubmissionId());
                        m.put("routeNode", dto.getNodeId());
                        m.put("startAt",   dto.getStartedAt().format(fmt));
                        try {
                            return objectMapper.writeValueAsString(m);
                        } catch (JsonProcessingException e) {
                            throw new RuntimeException("Route JSON 직렬화 실패", e);
                        }
                    })
                    .collect(Collectors.toList());

            statusService.saveAmr(amrDto, routeListJson);

            Integer currentNode = amrDto.body().currentNode();
            Integer previousNode = previousNodeMap.put(amrId, currentNode);

            // 목적 노드가 바뀌면 대기하고 있던 다음 amr에 permit 보내줌
            if (previousNode != null && !previousNode.equals(currentNode)) {
                if (amrId.equals(nodeOccupants.get(previousNode))) {
                    nodeOccupants.remove(previousNode);
                    Queue<String> queue = nodeQueues.get(previousNode);
                    if (queue != null && !queue.isEmpty()) {
                        String nextAmrId = queue.poll();
                        nodeOccupants.put(previousNode, nextAmrId);
                        int nextSubmissionId = lastSubmissionMap.get(nextAmrId);
                        String nextMissionId = lastMissionMap.get(nextAmrId);
                        sendTrafficPermit(nextAmrId, nextMissionId, nextSubmissionId, previousNode, session);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("AMR_STATE 처리 실패: " + e.getMessage());
            e.printStackTrace();
        }
    }


    private void handleTrafficRequest(Map<String, Object> json, WebSocketSession session) {
        Map<String, Object> body = (Map<String, Object>) json.get("body");
        String amrId = (String) body.get("amrId");
        int nodeId = (Integer) body.get("nodeId");
        int submissionId = (Integer) body.get("submissionId");
        String missionId = (String) body.get("missionId");

        // 이 시점에 세션을 맵에 담아두면, 이후 sendTrafficPermit에서 항상 꺼낼 수 있습니다.
        amrSessions.put(amrId, session);
        log.info("▶ TRAFFIC_REQ: amrId={} sessionId={} 등록", amrId, session.getId());

        // 기존 로직 그대로
        System.out.println("🚥 TRAFFIC_REQ 수신: " + amrId + " → 노드 " + nodeId);
        nodeQueues.computeIfAbsent(nodeId, k -> new LinkedList<>());

        String currentOccupant = nodeOccupants.get(nodeId);
        if (currentOccupant == null) {
            nodeOccupants.put(nodeId, amrId);
            sendTrafficPermit(amrId, missionId, submissionId, nodeId, session);
        } else {
            nodeQueues.get(nodeId).add(amrId);
            System.out.println("대기열 추가됨: " + amrId + " → 노드 " + nodeId);
        }
    }

    private void sendTrafficPermit(String amrId, String missionId, int submissionId, int nodeId, WebSocketSession session) {
        try {

            System.out.println("▶ sendTrafficPermit 호출: amrId=" + amrId
                    + ", session=" + session + ", open=" + (session != null && session.isOpen()));

            Map<String, Object> wrapper = new HashMap<>();

            // 2) header 생성
            Map<String, Object> header = new HashMap<>();
            header.put("msgName", "TRAFFIC_PERMIT");
            header.put("amrId", amrId);
            header.put("time", LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS")));
            wrapper.put("header", header);

            // 3) body 생성 (기존 traffic 맵 내용)
            Map<String, Object> body = new HashMap<>();
            body.put("missionId", missionId);
            body.put("submissionId", submissionId);
            body.put("nodeId", nodeId);
            wrapper.put("body", body);

            // 4) JSON 변환 & 전송
            String message = objectMapper.writeValueAsString(wrapper);


            if (session != null && session.isOpen()) {
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