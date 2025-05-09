package com.ssafy.flip.domain.status.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.status.dto.response.AmrMissionDTO;
import com.ssafy.flip.domain.status.dto.response.AmrMissionResponseDTO;
import com.ssafy.flip.domain.status.repository.AmrStatusRedisRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebResultConsumer {

    private final SimpMessagingTemplate messagingTemplate;
    private final AmrStatusRedisRepository amrStatusRedisRepository;
    private final MissionService missionService;

    private final ObjectMapper mapper;

    @KafkaListener(topics = "web-trigger",
            groupId = "flip-algorithm-group-web",
            concurrency = "4")
    public void applyResult(String msg) {
        try {
            List<AmrMissionDTO> responses = mapper.readValue(
                    msg,
                    new TypeReference<List<AmrMissionDTO>>() {}
            );

            //미션 저장
            Map <String, AmrMissionDTO> amrMissionMap = missionService.setAmrMission(responses);

            List<AmrMissionResponseDTO> amrMissionResponseDTOS = amrStatusRedisRepository.findAll().stream()
                    .map(status -> {
                        AmrMissionDTO missionDTO = amrMissionMap.get(status.getAmrId());
                        return AmrMissionResponseDTO.from(status, missionDTO);
                    })
                    .toList();

            messagingTemplate.convertAndSend("/amr/mission", amrMissionResponseDTOS);
        } catch (Exception e) {
            log.error(e.getMessage());
        }
    }

}
