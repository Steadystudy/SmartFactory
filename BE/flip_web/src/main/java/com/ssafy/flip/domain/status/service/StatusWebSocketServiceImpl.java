package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.line.service.LineService;
import com.ssafy.flip.domain.status.dto.request.*;
import com.ssafy.flip.domain.status.dto.response.*;
import com.ssafy.flip.domain.status.entity.AmrStatusRedis;
import com.ssafy.flip.domain.status.repository.AmrStatusRedisManualRepository;
import com.ssafy.flip.domain.status.repository.AmrStatusRedisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class StatusWebSocketServiceImpl implements StatusWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final AmrStatusRedisManualRepository amrStatusRedisManualRepository;
    private final LineService lineService;
    private final MissionService missionService;

    @Scheduled(fixedRate = 100)
    private void broadcastRealTimeStatus() {
        List<AmrStatusRedis> amrStatusIterable = amrStatusRedisManualRepository.findAllAmrStatus();
        List<AmrRealTimeDTO> amrRealTimeDTOList = new ArrayList<>();

        for (AmrStatusRedis amrStatus : amrStatusIterable) {
            amrRealTimeDTOList.add(AmrRealTimeDTO.from(amrStatus));
        }

        AmrRealTimeResponseDTO response = new AmrRealTimeResponseDTO(amrRealTimeDTOList);
        messagingTemplate.convertAndSend("/amr/real-time", response);
    }

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();

        if (Objects.equals(destination, "/amr/mission")) {
            pushMissionStatus(null);
        }
    }

    @Override
    public void pushMissionStatus(AmrMissionRequestDTO requestDTO) {
        //미션 저장
        Map<String, AmrMissionDTO> amrMissionMap = missionService.getAmrMission();

        List<AmrMissionResponseDTO> amrMissionResponseDTOS = amrStatusRedisManualRepository.findAllAmrStatus().stream()
                .map(status -> {
                    String rawAmrId = status.getAmrId();
                    String amrId = rawAmrId.startsWith("AMR_STATUS:") ? rawAmrId.substring("AMR_STATUS:".length()) : rawAmrId;
                    AmrMissionDTO missionDTO = amrMissionMap.get(amrId);
                    return AmrMissionResponseDTO.from(status, missionDTO);
                })
                .toList();

        messagingTemplate.convertAndSend("/amr/mission", amrMissionResponseDTOS);
    }

    @Override
    @Scheduled(fixedRate = 1000)
    public void pushLineStatus() {
        List<LineStatusResponseDTO> lineStatusResponseDTOSs = lineService.findAll().stream()
            .map(LineStatusResponseDTO::from)
            .toList();
        messagingTemplate.convertAndSend("/amr/line", lineStatusResponseDTOSs);
    }
}
