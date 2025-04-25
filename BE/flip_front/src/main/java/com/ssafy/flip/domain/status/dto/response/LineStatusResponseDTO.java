package com.ssafy.flip.domain.status.dto.response;

import java.time.LocalDateTime;

public record LineStatusResponseDTO(
        String lineId,
        boolean required,
        LocalDateTime timestamp
) {
}
