package com.ssafy.flip.domain.log.service.mission;

import com.ssafy.flip.domain.log.dto.mission.request.*;
import com.ssafy.flip.domain.log.entity.MissionLog;

import java.util.Optional;

public interface MissionLogService {

    MissionLog save(MissionLog missionLog);

    Optional<MissionLog> findById(Long id);

    MissionLog getMissionLog(Long id);

    MissionLog addMissionLog(AddMissionLogRequestDTO requestDTO);

}
