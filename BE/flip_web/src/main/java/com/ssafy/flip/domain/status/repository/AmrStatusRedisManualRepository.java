package com.ssafy.flip.domain.status.repository;

import com.ssafy.flip.domain.status.entity.AmrStatusRedis;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;
import java.util.*;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class AmrStatusRedisManualRepository {

    private final RedisTemplate<String, String> redisTemplate;

    public List<AmrStatusRedis> findAllAmrStatus() {
        Set<String> keys = redisTemplate.keys("AMR_STATUS:*");
        if (keys.isEmpty()) return Collections.emptyList();

        return keys.stream()
                .map(key -> {
                    Map<Object, Object> map = redisTemplate.opsForHash().entries(key);
                    String amrId = key.replace("AMR_STATUS:", "");
                    return convertMapToAmrStatusRedis(map, amrId);
                })
                .collect(Collectors.toList());
    }

    public Optional<AmrStatusRedis> findByAmrId(String amrId) {
        String key = "AMR_STATUS:" + amrId;
        if (!Boolean.TRUE.equals(redisTemplate.hasKey(key))) return Optional.empty();

        Map<Object, Object> map = redisTemplate.opsForHash().entries(key);
        if (map.isEmpty()) return Optional.empty();

        return Optional.of(convertMapToAmrStatusRedis(map, amrId));
    }

    private AmrStatusRedis convertMapToAmrStatusRedis(Map<Object, Object> map, String amrId) {
        return AmrStatusRedis.builder()
                .amrId(amrId)
                .x(Float.parseFloat((String) map.get("x")))
                .y(Float.parseFloat((String) map.get("y")))
                .direction(Float.parseFloat((String) map.getOrDefault("direction", "0")))
                .state(Integer.parseInt((String) map.get("state")))
                .battery(Integer.parseInt((String) map.get("battery")))
                .loading(Boolean.parseBoolean((String) map.get("loading")))
                .linearVelocity(Float.parseFloat((String) map.get("linearVelocity")))
                .currentNode(Integer.parseInt((String) map.get("currentNode")))
                .missionId((String) map.get("missionId"))
                .missionType((String) map.get("missionType"))
                .submissionId(Integer.parseInt((String) map.get("submissionId")))
                .errorList((String) map.get("errorList"))
                .type((String) map.get("type"))
                .submissionList(List.of())  // 추후 파싱 필요 시 처리
                .routeList(List.of())       // 추후 파싱 필요 시 처리
                .build();
    }
}
