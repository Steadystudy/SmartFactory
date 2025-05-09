package com.ssafy.flip.domain.mission.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@ToString
public class MissionResponse {

    private String amrId;
    private String missionId;
    private String missionType;
    private List<Integer> route;

    public MissionResponse(String amrId, String missionId, String missionType, List<Integer> route) {
        this.amrId = amrId;
        this.missionId = missionId;
        this.missionType = missionType;
        this.route = route;
    }
}
