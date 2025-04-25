package com.ssafy.flip.domain.status.dto.response;

import java.time.LocalDateTime;

public record AmrMissionResponseDTO(
    String amrId,
    int state,
    int missionId,
    String missionType,
    int submissionId,
    String errorCode,
    LocalDateTime timestamp,
    String type,
    float startX,
    float startY,
    float targetX,
    float targetY,
    int expectedArrival
) {
}
