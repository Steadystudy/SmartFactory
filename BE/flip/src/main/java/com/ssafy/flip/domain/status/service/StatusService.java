package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.status.dto.request.AmrSaveRequestDTO;
import com.ssafy.flip.domain.status.dto.request.MissionRequestDto;

public interface StatusService {

    void saveAmr(AmrSaveRequestDTO requestDTO,MissionRequestDto missionRequestDTO);

    MissionRequestDto Algorithim(int missionId);
}
