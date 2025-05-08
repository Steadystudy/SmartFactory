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
    private int mission;
    private List<Integer> route;

    public MissionResponse(String amrId, int mission, List<Integer> route) {
        this.amrId = amrId;
        this.mission = mission;
        this.route = route;
    }
}
