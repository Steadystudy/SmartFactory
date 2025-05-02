package com.ssafy.flip.domain.log.repository.mission;

import com.ssafy.flip.domain.log.entity.MissionLog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class MissionLogRepositoryImpl implements MissionLogRepository {

    private final MissionLogRepository missionLogRepository;

    @Override
    public MissionLog save(MissionLog missionLog) {
        return missionLogRepository.save(missionLog);
    }

    @Override
    public Optional<MissionLog> findById(Long id) {
        return missionLogRepository.findById(id);
    }
}
