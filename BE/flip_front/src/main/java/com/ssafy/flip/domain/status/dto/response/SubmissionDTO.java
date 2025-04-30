package com.ssafy.flip.domain.status.dto.response;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class SubmissionDTO{
    int submissionId;
    float submissionX;
    float submissionY;

    @JsonCreator
    public SubmissionDTO(
            @JsonProperty("submissionId") int submissionId,
            @JsonProperty("submissionX") float submissionX,
            @JsonProperty("submissionY") float submissionY
    ) {
        this.submissionId = submissionId;
        this.submissionX = submissionX;
        this.submissionY = submissionY;
    }
}
