package com.ssafy.flip.domain.connect.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.mission.dto.MissionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlgorithmResultConsumer {

    private final ObjectMapper mapper;
    private final WebSocketService ws;
    private final StringRedisTemplate redis;

    @KafkaListener(topics = "algorithm-result",
            groupId = "flip-algorithm-group",
            concurrency = "4")
    public void applyResult(String msg) {
        try {
            // ✅ JSON 배열 → List<MissionResponse>
            List<MissionResponse> responses = mapper.readValue(
                    msg,
                    new TypeReference<List<MissionResponse>>() {}
            );

            for (MissionResponse res : responses) {
                // ① Redis AMR_STATUS:* 업데이트
                String key = "AMR_STATUS:" + res.getAmrId();
                redis.opsForHash().put(key, "missionId",      String.valueOf(res.getMission()));
                redis.opsForHash().put(key, "submissionList", mapper.writeValueAsString(res.getRoute()));
                System.out.println(res);

                // ② WebSocket으로 AMR에게 개별 미션 전송
                ws.sendMission(res.getAmrId(), res);
            }

        } catch (Exception e) {
            log.error("알고리즘 결과 처리 실패", e);
        }
    }

}
