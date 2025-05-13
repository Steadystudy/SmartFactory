package com.ssafy.flip.domain.status.dto.request;

public record RouteDTO(
        int routeId,
        int routeNode,
        String startedAt
) {
}
