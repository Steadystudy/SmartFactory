package com.ssafy.flip.domain.connect.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.connect.dto.request.HumanSaveRequestDTO;
import com.ssafy.flip.domain.connect.dto.request.HumanStartRequestDTO;
import com.ssafy.flip.domain.connect.service.HumanWebSocketService;
import com.ssafy.flip.domain.line.service.LineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class HumanWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final ThreadPoolTaskExecutor humanTaskExecutor;

    private final HumanWebSocketService humanWebSocketService;

    private final LineService lineService;

    private WebSocketSession session;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("HUMAN 연결 : {}", session.getId());
        this.session = session;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        String payload = message.getPayload();

        humanTaskExecutor.execute(() -> {
            try {
                Map<String, Object> jsonMap = objectMapper.readValue(payload, Map.class);
                String msgName = (String) ((Map<?, ?>) jsonMap.get("header")).get("msgName");
                switch (msgName) {
                    case "HUMAN_STATE":
                        handleHumanState(jsonMap, session);
                        break;
                    default:
                        log.warn("Unknown message: {}", msgName);
                }
            } catch (Exception ex) {
                log.error("비동기 메시지 처리 중 에러", ex);
            }
        });
    }

    private void handleHumanState(Map<String, Object> json, WebSocketSession session) {
        try {
            HumanSaveRequestDTO requestDTO = objectMapper.convertValue(json, HumanSaveRequestDTO.class);

            humanWebSocketService.saveHuman(requestDTO);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public void sendStart() throws IOException {
        HumanStartRequestDTO requestDTO = new HumanStartRequestDTO(new HumanStartRequestDTO.Header("MOVE_TRIGGER", null), new HumanStartRequestDTO.Body());
        String payload = objectMapper.writeValueAsString(requestDTO);
        this.session.sendMessage(new TextMessage(payload));
        // 20초 후에 비동기 작업 실행
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(20000); // 20초 대기
                lineService.repairLine(10L);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                e.printStackTrace();
            }
        });
    }
}
