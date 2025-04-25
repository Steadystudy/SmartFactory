package com.ssafy.flip.domain.status.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AmrRealTimeDTO {
    String amrId;
    int state;
    float locationX;
    float locationY;
    float dir;
    int currentNode;
    boolean loading;
    int linearVelocity;
    String errorCode;
}
