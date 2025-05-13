package com.ssafy.flip.domain.line.service;

import com.ssafy.flip.domain.line.entity.Line;
import com.ssafy.flip.domain.line.repository.LineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LineServiceImpl implements LineService {

    private final LineRepository lineRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public List<Line> findAll() {
        return lineRepository.findAll();
    }

    @Override
    public Optional<Line> findById(Long id) {
        return lineRepository.findById(id);
    }

    @Override
    public Line getLine(Long id) {
        return lineRepository.findById(id)
                .orElseThrow();
    }

    @Override
    public void disableMissionAssignment(String missionId){
        String redisKey = "MISSION_PT:" + missionId;
        redisTemplate.opsForValue().set(redisKey, "-1");
    }

    @Override
    public void updateMissionAssignment(String missionId){
        String redisKey = "MISSION_PT:" + missionId;
        String now = LocalDateTime.now().toString();  // 예: "2025-05-13T13:08:55.8292675"
        redisTemplate.opsForValue().set(redisKey, now);
    }

    @Override
    public void markMissionBlockedNow(String missionId) {
        // "MISSION050" → 50
        String missionNum = missionId.replaceAll("\\D+", "");
        int missionNumber = Integer.parseInt(missionNum);
        String redisKey = "MISSION_PT:" + missionNumber;

        String now = LocalDateTime.now().toString();  // 예: "2025-05-13T13:08:55.8292675"
        redisTemplate.opsForValue().set(redisKey, now);
    }




}
