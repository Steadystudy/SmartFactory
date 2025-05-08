package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.status.dto.request.AmrSaveRequestDTO;
import com.ssafy.flip.domain.status.dto.request.MissionRequestDto;

import java.util.List;

public interface StatusService {

    void saveAmr(AmrSaveRequestDTO requestDTO,MissionRequestDto missionRequestDTO, List<String> routeList);

    MissionRequestDto Algorithim(String missionId);

    void processAMRSTATUS(AmrSaveRequestDTO amrDto);
}
