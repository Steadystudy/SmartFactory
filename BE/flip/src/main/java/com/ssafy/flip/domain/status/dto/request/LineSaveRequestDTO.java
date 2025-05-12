package com.ssafy.flip.domain.status.dto.request;

public record LineSaveRequestDTO(
        Long lineId,
        Float cycleTime,
        Boolean status
) {
}
