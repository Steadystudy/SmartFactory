package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.line.service.LineService;
import com.ssafy.flip.domain.status.dto.request.*;
import com.ssafy.flip.domain.status.dto.response.*;
import com.ssafy.flip.domain.status.entity.AmrStatusRedis;
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
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class StatusWebSocketServiceImpl implements StatusWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final AmrStatusRedisRepository amrStatusRedisRepository;
    private final LineService lineService;

    @Scheduled(fixedRate = 100)
    private void broadcastRealTimeStatus() {
        Iterable<AmrStatusRedis> amrStatusIterable = amrStatusRedisRepository.findAll();
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
        List<AmrMissionResponseDTO> amrMissionResponseDTOS = amrStatusRedisRepository.findAll()
                .stream()
                .map(AmrMissionResponseDTO::from)
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
