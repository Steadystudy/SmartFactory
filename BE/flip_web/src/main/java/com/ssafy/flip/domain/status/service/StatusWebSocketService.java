package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.status.dto.request.AmrMissionRequestDTO;

public interface StatusWebSocketService {

    void pushMissionStatus(AmrMissionRequestDTO requestDTO);

    void pushLineStatus();

}
