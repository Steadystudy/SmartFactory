package com.ssafy.flip.domain.connect.dto.request;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record RouteTempDTO(
        String missionId,
        int submissionId,
        int nodeId,
        int edgeId,
        LocalDateTime startedAt,
        LocalDateTime endedAt
) {}
