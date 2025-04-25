package com.ssafy.flip.domain.status.dto.response;

import java.util.List;

public record MissionStatusResponseDTO(
        List<SubmissionDTO> missionStatusList
) {
}
