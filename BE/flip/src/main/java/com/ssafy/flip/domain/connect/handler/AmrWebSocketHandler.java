package com.ssafy.flip.domain.connect.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.amr.entity.AMR;
import com.ssafy.flip.domain.connect.dto.request.RouteTempDTO;
import com.ssafy.flip.domain.connect.service.WebSocketService;
import com.ssafy.flip.domain.log.entity.MissionLog;
import com.ssafy.flip.domain.log.entity.Route;
import com.ssafy.flip.domain.log.service.mission.MissionLogService;
import com.ssafy.flip.domain.mission.entity.Mission;
import com.ssafy.flip.domain.status.dto.request.AmrSaveRequestDTO;
import com.ssafy.flip.domain.status.dto.request.MissionRequestDto;
import com.ssafy.flip.domain.status.service.StatusService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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


    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("AMR 연결 : " + session.getId());

        String mapInfoJson = webSocketService.sendMapInfo();

        session.sendMessage(new TextMessage(mapInfoJson));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
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

    private void handleAmrState(Map<String, Object> json, WebSocketSession session) {
        try {
            Map<String, Object> body = (Map<String, Object>) json.get("body");
            String amrId = (String) body.get("amrId");
            amrSessions.put(amrId, session);

            AmrSaveRequestDTO amrDto = objectMapper.convertValue(json, AmrSaveRequestDTO.class);

            int missionId = amrDto.body().missionId();
            Integer currentSubmission = amrDto.body().submissionId();
            int nodeId = amrDto.body().currentNode();
            int edgeId = amrDto.body().currentEdge();

            Integer lastSubmission = lastSubmissionMap.get(amrId);

            // 🔄 submission 변경 감지
            if (lastSubmission != null && !lastSubmission.equals(currentSubmission)) {
                LocalDateTime now = LocalDateTime.now();

                // 이전 submission의 RouteTemp 저장
                routeTempMap.computeIfAbsent(amrId, k -> new ArrayList<>()).add(
                        RouteTempDTO.builder()
                                .missionId(missionId)
                                .submissionId(lastSubmission)
                                .nodeId(nodeId)
                                .edgeId(edgeId)
                                .startedAt(submissionStartMap.get(amrId))
                                .endedAt(now)
                                .build()
                );

                submissionStartMap.put(amrId, now);
                lastSubmissionMap.put(amrId, currentSubmission);
            } else if (lastSubmission == null) {
                submissionStartMap.put(amrId, LocalDateTime.now());
                lastSubmissionMap.put(amrId, currentSubmission);
            }

            // ✅ 미션 종료 감지 (state == 1 → IDLE)
            if (amrDto.body().state() == 1) {
                List<RouteTempDTO> routeTemps = routeTempMap.get(amrId);
                if (routeTemps != null && !routeTemps.isEmpty()) {
                    missionLogService.saveWithRoutes(amrId, missionId, routeTemps);

                    // 정리
                    routeTempMap.remove(amrId);
                    submissionStartMap.remove(amrId);
                    lastSubmissionMap.remove(amrId);
                }
            }


            // 기존 처리
            MissionRequestDto missionRequestDto = statusService.Algorithim(missionId);
            statusService.saveAmr(amrDto, missionRequestDto);

        } catch (Exception e) {
            System.err.println("❌ AMR_STATE 처리 실패: " + e.getMessage());
        }
    }

    private void handleTrafficRequest(Map<String, Object> json) {
        Map<String, Object> body = (Map<String, Object>) json.get("body");
        String amrId = (String) body.get("amrId");
    }
}