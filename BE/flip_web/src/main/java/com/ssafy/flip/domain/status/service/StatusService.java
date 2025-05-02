package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.status.dto.request.AmrMissionRequestDTO;
import com.ssafy.flip.domain.status.dto.request.AmrSaveRequestDTO;
import com.ssafy.flip.domain.status.dto.response.*;

import java.util.List;

public interface StatusService {

    void saveAmr(AmrSaveRequestDTO requestDTO);

    List<AmrMissionResponseDTO> getAmrMissionStatus(AmrMissionRequestDTO requestDTO);

    AmrRealTimeResponseDTO getAmrRealTimeStatus();

    MissionStatusResponseDTO getRouteStatus(String amrId);

    LineStatusResponseDTO getLineStatus();

    FactoryStatusResponseDTO getFactoryStatus();
}
