package com.ssafy.flip.domain.status.dto.request;

public record SubmissionDTO(
        int submissionId,
        int submissionNode,
        float submissionX,
        float submissionY
) {
}
