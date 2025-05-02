package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.status.dto.request.AmrMissionRequestDTO;
import com.ssafy.flip.domain.status.dto.response.AmrMissionResponseDTO;
import com.ssafy.flip.domain.status.dto.response.AmrRealTimeResponseDTO;

import java.util.List;

public interface StatusWebSocketService {

    void pushMissionStatus(AmrMissionRequestDTO requestDTO);

}
