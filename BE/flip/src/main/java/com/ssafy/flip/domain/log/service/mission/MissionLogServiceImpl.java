package com.ssafy.flip.domain.log.service.mission;

import com.ssafy.flip.domain.amr.entity.AMR;
import com.ssafy.flip.domain.amr.service.AmrService;
import com.ssafy.flip.domain.log.dto.mission.request.*;
import com.ssafy.flip.domain.log.entity.MissionLog;
import com.ssafy.flip.domain.log.repository.mission.MissionLogRepository;
import com.ssafy.flip.domain.mission.entity.Mission;
import com.ssafy.flip.domain.mission.service.MissionService;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MissionLogServiceImpl implements MissionLogService {

    private final MissionLogRepository missionLogRepository;

    private final MissionService missionService;

    private final AmrService amrService;

    @Override
    public MissionLog save(MissionLog missionLog) {
        return missionLogRepository.save(missionLog);
    }

    @Override
    public Optional<MissionLog> findById(Long id) {
        return missionLogRepository.findById(id);
    }

    @Override
    public MissionLog getMissionLog(Long id) {
        return missionLogRepository.findById(id)
                .orElseThrow();
    }

    @Override
    public MissionLog addMissionLog(AddMissionLogRequestDTO requestDTO) {
        MissionLog missionLog = MissionLog.builder()
                .mission(missionService.getMission(requestDTO.missionId()))
                .amr(amrService.getById(requestDTO.amrId()))
                .startedAt(requestDTO.startedAt())
                .endedAt(requestDTO.endedAt())
                .build();

        return missionLogRepository.save(missionLog);
    }
}
