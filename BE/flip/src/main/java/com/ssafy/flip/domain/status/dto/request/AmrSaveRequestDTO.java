package com.ssafy.flip.domain.status.dto.request;

import org.springframework.data.annotation.Id;

import java.util.List;

public record AmrSaveRequestDTO(
        Header header,
        Body body
) {
    public record Header(
            String msgName,
            String time
    ) {}

    public record Body(
            float worldX,
            float worldY,
            float dir,
            String amrId,
            int state,
            int battary,
            int currentNode,
            boolean loading,
            int missionId,
            String missionType,
            int submissionId,
            float linearVelocity,
            String errorList
    ) {}
}
