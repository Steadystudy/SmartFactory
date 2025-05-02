package com.ssafy.flip.domain.connect.dto.response;

import java.util.List;

public record MissionAssignDTO(
        Header header,
        Body body
) {
    public static MissionAssignDTO of(String amrId, String missionId, String missionType, List<SubmissionDTO> submissions) {
        return new MissionAssignDTO(
                new Header("MISSION_ASSIGN", java.time.LocalDateTime.now().toString(), amrId),
                new Body(missionId, missionType, submissions)
        );
    }

    public record Header(
            String msgName,
            String time,
            String amrId
    ) {}

    public record Body(
            String missionId,
            String missionType,
            List<SubmissionDTO> submissions
    ) {}

    public record SubmissionDTO(
            String submissionId,
            String nodeId,
            String edgeId
    ) {}
}