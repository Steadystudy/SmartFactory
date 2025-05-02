package com.ssafy.flip.domain.connect.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.connect.dto.response.*;
import com.ssafy.flip.domain.connect.handler.AmrWebSocketHandler;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ConnectServiceImpl implements ConnectService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, WebSocketSession> amrSessions;

    public ConnectServiceImpl(AmrWebSocketHandler amrHandler) {
        this.amrSessions = amrHandler.getAmrSessions();
    }

    public void sendMission(String amrId, Map<String, Object> mission) throws IOException {
        WebSocketSession session = amrSessions.get(amrId);
        if (session != null && session.isOpen()) {
            MissionAssignDTO missionAssignDTO = MissionAssignDTO.of(
                    (String) mission.get("amrId"),
                    (String) mission.get("missionId"),
                    (String) mission.get("missionType"),
                    (List<MissionAssignDTO.SubmissionDTO>) mission.get("submissions"));
            String json = objectMapper.writeValueAsString(mission);
            session.sendMessage(new TextMessage(json));
        } else {
            throw new IllegalStateException("해당 AMR이 존재하지 않음 : " + amrId);
        }
    }

    public Set<String> getConnectedAmrs() {
        return amrSessions.keySet();
    }

}
