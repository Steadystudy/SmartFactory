package com.ssafy.flip.domain.status.dto.response;

import com.ssafy.flip.domain.line.entity.Line;

import java.time.LocalDateTime;

public record LineStatusResponseDTO(
        Long lineId,
        Integer amount,
        boolean status,
        LocalDateTime timestamp
) {
    public static LineStatusResponseDTO from(Line line){
        return new LineStatusResponseDTO(
                line.getLineId(),
                10,
                line.isStatus(),
                LocalDateTime.now());
    }
}
