package com.ssafy.flip.domain.connect.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.amr.entity.AMR;
import com.ssafy.flip.domain.amr.repository.AmrJpaRepository;
import com.ssafy.flip.domain.connect.dto.request.AmrMissionDTO;
import com.ssafy.flip.domain.mission.dto.MissionResponse;
import com.ssafy.flip.domain.node.entity.Node;
import com.ssafy.flip.domain.node.repository.node.NodeJpaRepository;
import com.ssafy.flip.domain.status.dto.request.MissionRequestDto;
import com.ssafy.flip.domain.status.service.StatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlgorithmResultConsumer {

    private final ObjectMapper mapper;
    private final WebSocketService ws;
    private final StringRedisTemplate redis;
    private final WebTriggerProducer webTrigger;
    private final AmrJpaRepository amrJpaRepository;
    private final NodeJpaRepository nodeJpaRepository;
    private final StatusService statusService;

    @KafkaListener(topics = "algorithm-result",
            groupId = "flip-algorithm-group",
            concurrency = "4")
    public void applyResult(String msg) {

        List<AmrMissionDTO> amrMissionList = new ArrayList<>();

        try {
            // ✅ JSON 배열 → List<MissionResponse>
            List<MissionResponse> responses = mapper.readValue(
                    msg,
                    new TypeReference<List<MissionResponse>>() {}
            );

            for (MissionResponse res : responses) {
                // ① Redis AMR_STATUS:* 업데이트
                String key = "AMR_STATUS:" + res.getAmrId();
                redis.opsForHash().put(key, "missionId",      String.valueOf(res.getMissionId()));
                redis.opsForHash().put(key, "missionType",      String.valueOf(res.getMissionType()));
                redis.opsForHash().put(key, "submissionList", mapper.writeValueAsString(res.getRoute()));
                System.out.println(res);

                String amrId = res.getAmrId();
                // ② WebSocket으로 AMR에게 개별 미션 전송
                ws.sendMission(amrId, res);

                String type = amrJpaRepository.findById(amrId)
                        .map(AMR::getType)
                        .orElseThrow(() -> new IllegalArgumentException("해당 AMR 없음"));

                List<Integer> routes = res.getRoute();
                int startNodeId = routes.getFirst();
                int targetNodeId = routes.getLast();

                Node startNodeDto = nodeJpaRepository.findById(startNodeId)
                        .orElseThrow(() -> new RuntimeException("노드 정보 없음: " + startNodeId));
                Node targetNodeDto = nodeJpaRepository.findById(targetNodeId)
                        .orElseThrow(() -> new RuntimeException("노드 정보 없음: " + targetNodeId));

                // ✅ submissionList 생성
                List<String> submissionList = IntStream.range(0, routes.size())
                        .mapToObj(i -> {
                            int submissionId = i + 1;
                            int nodeId = routes.get(i);

                            Node node = nodeJpaRepository.findById(nodeId)
                                    .orElseThrow(() -> new RuntimeException("노드 정보 없음: " + nodeId));

                            Map<String, Object> jsonMap = new LinkedHashMap<>();
                            jsonMap.put("submissionId", submissionId);
                            jsonMap.put("submissionNode", nodeId);
                            jsonMap.put("submissionX", node.getX());
                            jsonMap.put("submissionY", node.getY());

                            try {
                                return mapper.writeValueAsString(jsonMap);
                            } catch (JsonProcessingException e) {
                                throw new RuntimeException("JSON 변환 실패", e);
                            }
                        })
                        .toList();

                statusService.updateSubmissionList(amrId, submissionList);

                amrMissionList.add(new AmrMissionDTO(
                        amrId,
                        type,
                        startNodeDto.getX(),
                        startNodeDto.getY(),
                        targetNodeDto.getX(),
                        targetNodeDto.getY(),
                        res.getExpectedArrival(),
                        LocalDateTime.now()
                ));
            }

            String payload = mapper.writeValueAsString(amrMissionList);
            System.out.println("Web Trigger: "+payload);

            webTrigger.run(payload);

        } catch (Exception e) {
            log.error("알고리즘 결과 처리 실패", e);
        }
    }

}
