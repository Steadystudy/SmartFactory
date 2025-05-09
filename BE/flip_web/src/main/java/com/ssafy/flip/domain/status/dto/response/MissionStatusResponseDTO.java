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

        List<String> submissionList = amrStatusRedis.getSubmissionList();
        int submissionId = amrStatusRedis.getSubmissionId(); // 기준 인덱스

        for (int i = submissionId; i < submissionList.size(); i++) {
            String submissionJson = submissionList.get(i);
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
