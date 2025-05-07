package com.ssafy.flip.domain.status.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.amr.entity.AMR;
import com.ssafy.flip.domain.amr.repository.AmrJpaRepository;
import com.ssafy.flip.domain.line.entity.Line;
import com.ssafy.flip.domain.log.entity.MissionLog;
import com.ssafy.flip.domain.node.entity.Node;
import com.ssafy.flip.domain.node.repository.node.NodeJpaRepository;
import com.ssafy.flip.domain.status.dto.request.*;
import com.ssafy.flip.domain.status.entity.AmrStatusRedis;
import com.ssafy.flip.domain.status.repository.AmrStatusRedisRepository;
import com.ssafy.flip.domain.storage.entity.Storage;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
public class StatusServiceImpl implements StatusService{

    private final AmrStatusRedisRepository amrStatusRedisRepository;

    private final NodeJpaRepository nodeJpaRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private final AmrJpaRepository amrJpaRepository;

    @Override
    @Transactional
    public void saveAmr(AmrSaveRequestDTO amrSaveRequestDTO, MissionRequestDto missionRequestDTO) {
        String type = amrJpaRepository.findById(amrSaveRequestDTO.body().amrId())
                .map(AMR::getType)
                .orElseThrow(() -> new IllegalArgumentException("해당 AMR 없음"));

        List<MissionRequestDto.Routes> routes = missionRequestDTO.body().routes();
        int startNodeId = routes.get(0).nodeId();
        int targetNodeId = routes.get(routes.size() - 1).nodeId();

        Node startNodeDto = nodeJpaRepository.findById(startNodeId)
                .orElseThrow(() -> new RuntimeException("노드 정보 없음: " + startNodeId));
        Node targetNodeDto = nodeJpaRepository.findById(targetNodeId)
                .orElseThrow(() -> new RuntimeException("노드 정보 없음: " + targetNodeId));

        // ✅ submissionList 생성
        List<String> submissionList = IntStream.range(0, routes.size())
                .mapToObj(i -> {
                    int submissionId = i + 1;
                    int nodeId = routes.get(i).nodeId();

                    Node node = nodeJpaRepository.findById(nodeId)
                            .orElseThrow(() -> new RuntimeException("노드 정보 없음: " + nodeId));

                    Map<String, Object> jsonMap = new LinkedHashMap<>();
                    jsonMap.put("submissionId", submissionId);
                    jsonMap.put("submissionNode", nodeId);
                    jsonMap.put("submissionX", node.getX());
                    jsonMap.put("submissionY", node.getY());

                    try {
                        return objectMapper.writeValueAsString(jsonMap);
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException("JSON 변환 실패", e);
                    }
                })
                .toList();

        // ✅ Redis 저장 객체 생성
        AmrStatusRedis amrStatusRedis = AmrStatusRedis.builder()
                .amrId(amrSaveRequestDTO.body().amrId())
                .x(amrSaveRequestDTO.body().worldX())
                .y(amrSaveRequestDTO.body().worldY())
                .direction(amrSaveRequestDTO.body().dir())
                .state(amrSaveRequestDTO.body().state())
                .battery(amrSaveRequestDTO.body().battery())
                .loading(amrSaveRequestDTO.body().loading())
                .linearVelocity(amrSaveRequestDTO.body().linearVelocity())
                .currentNode(amrSaveRequestDTO.body().currentNode())
                .missionId(amrSaveRequestDTO.body().missionId())
                .missionType(amrSaveRequestDTO.body().missionType())
                .submissionId(amrSaveRequestDTO.body().submissionId())
                .errorList(amrSaveRequestDTO.body().errorList())
                .type(type)
                .startX(startNodeDto.getX())
                .startY(startNodeDto.getY())
                .targetX(targetNodeDto.getX())
                .targetY(targetNodeDto.getY())
                .expectedArrival(missionRequestDTO.body().expectedArrival())
                .submissionList(submissionList)
                .routeList(List.of(
                        "{ \"submissionId\": 1, \"submissionNode\": 10, \"submissionX\": 2.5, \"submissionY\": 3.7 }"
                ))
                .build();

        amrStatusRedisRepository.save(amrStatusRedis);
    }


    @Override
    public MissionRequestDto Algorithim(int missionId) {
        String dummyJson = """
{
   "header": {
      "msgName": "MISSION_ASSIGN",
      "time": "2025-05-02 14:25:10.000"
   },
   "body": {
      "missionId": 1,
      "missionType": "MOVING",
      "expectedArrival": 18.83,
      "routes": [
         { "nodeId": 1 },
         { "nodeId": 2 },
         { "nodeId": 4 },
         { "nodeId": 5 },
         { "nodeId": 9 }
      ]
   }
}
""".formatted(missionId);


        ObjectMapper objectMapper = new ObjectMapper();
        try {
            return objectMapper.readValue(dummyJson, MissionRequestDto.class);
        } catch (Exception e) {
            throw new RuntimeException("🚨 JSON 파싱 실패", e);
        }
    }
}
