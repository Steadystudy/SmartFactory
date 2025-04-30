package com.ssafy.flip.domain.status.dto.response;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.status.entity.AmrStatusRedis;

import java.util.ArrayList;
import java.util.List;

public record MissionStatusResponseDTO(
        List<SubmissionDTO> missionStatusList
) {
    public static MissionStatusResponseDTO from(AmrStatusRedis amrStatusRedis) {
        List<SubmissionDTO> submissionDTOList = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();

        for (String submissionJson : amrStatusRedis.getSubmissionList()) {
            try {
                SubmissionDTO dto = objectMapper.readValue(submissionJson, SubmissionDTO.class);
                submissionDTOList.add(dto);
            } catch (Exception e) {
                // 파싱 실패하면 로그 찍고 넘어감
                e.printStackTrace();
            }
        }

        return new MissionStatusResponseDTO(submissionDTOList);
    }
}
