package com.ssafy.flip.domain.connect.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.connect.service.WebSocketService;
import com.ssafy.flip.domain.status.dto.request.AmrSaveRequestDTO;
import com.ssafy.flip.domain.status.dto.request.MissionRequestDto;
import com.ssafy.flip.domain.status.service.StatusService;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

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
            // 1. 세션 저장
            Map<String, Object> body = (Map<String, Object>) json.get("body");
            String amrId = (String) body.get("amrId");
            amrSessions.put(amrId, session);

            // 2. 전체 JSON → DTO로 변환
            AmrSaveRequestDTO amrDto = objectMapper.convertValue(json, AmrSaveRequestDTO.class);

            // 3. 알고리즘 서버에서 미션 경로 정보 가져오기
            int missionId = amrDto.body().missionId();
            MissionRequestDto missionRequestDto = statusService.Algorithim(missionId); // 더미 OK

            // 4. 기존 로직 호출
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