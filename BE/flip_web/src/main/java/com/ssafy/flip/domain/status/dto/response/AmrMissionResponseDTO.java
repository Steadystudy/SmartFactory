package com.ssafy.flip.domain.status.dto.response;

import com.ssafy.flip.domain.status.entity.AmrStatusRedis;

import java.time.LocalDateTime;

public record AmrMissionResponseDTO(
    String amrId,
    int state,
    String missionId,
    String missionType,
    int submissionId,
    String errorCode,
    LocalDateTime timestamp,
    int battery,
    String type,
    float startX,
    float startY,
    float targetX,
    float targetY,
    int expectedArrival,
    LocalDateTime startedAt
) {
    public static AmrMissionResponseDTO from(AmrStatusRedis amrStatusRedis, AmrMissionDTO missionDTO) {
        return new AmrMissionResponseDTO(
                amrStatusRedis.getAmrId(),
                amrStatusRedis.getState(), // state가 String이라 변환 필요
                amrStatusRedis.getMissionId(),      // missionId도 String이어서 변환 필요
                amrStatusRedis.getMissionType(),
                amrStatusRedis.getSubmissionId(),
                amrStatusRedis.getErrorList(),                      // errorList가 그냥 String
                LocalDateTime.now(),
                amrStatusRedis.getBattery(),                           // timestamp는 현재 시간
                missionDTO.type(),
                missionDTO.startX(),
                missionDTO.startY(),
                missionDTO.targetX(),
                missionDTO.targetY(),
                missionDTO.expectedArrival(),
                missionDTO.startedAt()
        );
    }
}
