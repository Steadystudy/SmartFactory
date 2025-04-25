package com.ssafy.flip.domain.status.dto.response;

import lombok.Getter;

@Getter
public class SubmissionDTO{
    int submissionId;
    float submissionX;
    float submissionY;

    public SubmissionDTO(int i, float x, float y) {
        submissionId = i;
        submissionX = x;
        submissionY = y;
    }
}
