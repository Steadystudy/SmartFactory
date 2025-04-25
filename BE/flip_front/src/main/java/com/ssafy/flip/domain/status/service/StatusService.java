package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.status.dto.request.AmrMissionRequestDTO;
import com.ssafy.flip.domain.status.dto.response.*;

public interface StatusService {

    AmrMissionResponseDTO getAmrMissionStatus(AmrMissionRequestDTO requestDTO);

    AmrRealTimeResponseDTO getAmrRealTimeStatus();

    LineStatusResponseDTO getLineStatus();

    MissionStatusResponseDTO getMissionStatus(Long missionId);

    FactoryStatusResponseDTO getFactoryStatus();
}
