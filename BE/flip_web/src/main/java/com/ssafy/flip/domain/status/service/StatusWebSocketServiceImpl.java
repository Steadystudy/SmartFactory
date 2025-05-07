package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.status.dto.request.AmrMissionRequestDTO;
import com.ssafy.flip.domain.status.dto.response.AmrMissionResponseDTO;
import com.ssafy.flip.domain.status.dto.response.AmrRealTimeDTO;
import com.ssafy.flip.domain.status.dto.response.AmrRealTimeResponseDTO;
import com.ssafy.flip.domain.status.entity.AmrStatusRedis;
import com.ssafy.flip.domain.status.repository.AmrStatusRedisRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
public class StatusWebSocketServiceImpl implements StatusWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final AmrStatusRedisRepository amrStatusRedisRepository;

//    @PostConstruct
//    public void startRealTimeBroadcast() {
//        Executors.newSingleThreadScheduledExecutor().scheduleAtFixedRate(
//                this::broadcastRealTimeStatus,
//                0, 1, TimeUnit.SECONDS
//        );
//    }

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

    @Override
    public void pushMissionStatus(AmrMissionRequestDTO requestDTO) {
        Iterable<AmrStatusRedis> amrStatusIterable = amrStatusRedisRepository.findAll();
        messagingTemplate.convertAndSend("/amr/mission", amrStatusIterable);
    }
}
