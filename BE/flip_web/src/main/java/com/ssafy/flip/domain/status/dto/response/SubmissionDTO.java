package com.ssafy.flip.domain.status.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SubmissionDTO(
        int submissionId,
        float submissionX,
        float submissionY
) {}

