package com.ssafy.flip.domain.status.dto.response;

import com.ssafy.flip.domain.status.entity.AmrStatusRedis;

import java.time.LocalDateTime;

public record AmrMissionResponseDTO(
    String amrId,
    int state,
    int missionId,
    String missionType,
    int submissionId,
    String errorCode,
    LocalDateTime timestamp,
    String type,
    float startX,
    float startY,
    float targetX,
    float targetY,
    int expectedArrival
) {
    public static AmrMissionResponseDTO from(AmrStatusRedis amrStatusRedis) {
        return new AmrMissionResponseDTO(
                amrStatusRedis.getAmrId(),
                amrStatusRedis.getState(), // state가 String이라 변환 필요
                amrStatusRedis.getMissionId(),      // missionId도 String이어서 변환 필요
                amrStatusRedis.getMissionType(),
                amrStatusRedis.getSubmissionId(),
                amrStatusRedis.getErrorList(),                      // errorList가 그냥 String
                LocalDateTime.now(),                                // timestamp는 현재 시간
                amrStatusRedis.getType(),
                amrStatusRedis.getStartX(),
                amrStatusRedis.getStartY(),
                amrStatusRedis.getTargetX(),
                amrStatusRedis.getTargetY(),
                amrStatusRedis.getExpectedArrival()
        );
    }
}
