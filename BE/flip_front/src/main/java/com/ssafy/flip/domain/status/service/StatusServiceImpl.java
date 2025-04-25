package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.status.dto.request.AmrMissionRequestDTO;
import com.ssafy.flip.domain.status.dto.response.*;

public class StatusServiceImpl implements StatusService{

    @Override
    public AmrMissionResponseDTO getAmrMissionStatus(AmrMissionRequestDTO requestDTO) {
        return null;
    }

    @Override
    public AmrRealTimeResponseDTO getAmrRealTimeStatus() {
        return null;
    }

    @Override
    public LineStatusResponseDTO getLineStatus() {
        return null;
    }

    @Override
    public MissionStatusResponseDTO getMissionStatus(Long missionId) {
        return null;
    }

    @Override
    public FactoryStatusResponseDTO getFactoryStatus() {
        return null;
    }
}
