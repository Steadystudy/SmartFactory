package com.ssafy.flip.domain.amr.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.IntStream;

@Component
@RequiredArgsConstructor
public class AmrRedisInitializer {//Redis에 AMR_STATUS:AMR001부터 AMR_STATUS:AMR020까지 존재하는지 확인후 없으면 빈값 넣는 코드

    private final StringRedisTemplate redisTemplate;

    @PostConstruct
    public void initializeAmrStatusInRedis() {
        IntStream.rangeClosed(1, 20).forEach(i -> {
            String amrId = String.format("AMR%03d", i); // AMR001 ~ AMR020
            String redisKey = "AMR_STATUS:" + amrId;

            Boolean exists = redisTemplate.hasKey(redisKey);
            if (Boolean.FALSE.equals(exists)) {
                Map<String, String> initialFields = new HashMap<>();
                initialFields.put("x", "");
                initialFields.put("y", "");
                initialFields.put("direction", "");

                initialFields.put("state", "");
                initialFields.put("battery", "");
                initialFields.put("loading", "");
                initialFields.put("linearVelocity", "");

                initialFields.put("currentNode", "");
                initialFields.put("missionId", "0");
                initialFields.put("missionType", "");
                initialFields.put("submissionId", "");

                initialFields.put("errorList", "");

                initialFields.put("type", "");

                initialFields.put("startX", "");
                initialFields.put("startY", "");
                initialFields.put("targetX", "");
                initialFields.put("targetY", "");

                initialFields.put("expectedArrival", "");

                initialFields.put("submissionList", "");
                initialFields.put("routeList", "");

                redisTemplate.opsForHash().putAll(redisKey, initialFields);
            }
        });
    }

    @PostConstruct
    public void initializeMissionPtInRedis() {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        String now = LocalDateTime.now().format(formatter);

        IntStream.rangeClosed(11, 50).forEach(i -> {
            String key = "MISSION_PT:" + i;
            Boolean exists = redisTemplate.hasKey(key);
            if (Boolean.FALSE.equals(exists)) {
                redisTemplate.opsForValue().set(key, now);
            }
        });
    }
}
