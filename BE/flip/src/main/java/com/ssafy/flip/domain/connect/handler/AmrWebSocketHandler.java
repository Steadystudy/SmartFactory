package com.ssafy.flip.domain.connect.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.connect.service.WebSocketService;
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
        Map<String, Object> body = (Map<String, Object>) json.get("body");
        String amrId = (String) body.get("amrId");
        amrSessions.put(amrId, session);
    }

    private void handleTrafficRequest(Map<String, Object> json) {
        Map<String, Object> body = (Map<String, Object>) json.get("body");
        String amrId = (String) body.get("amrId");
    }
}