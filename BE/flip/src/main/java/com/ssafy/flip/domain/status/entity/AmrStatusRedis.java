package com.ssafy.flip.domain.status.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@RedisHash("amr")
public class AmrStatusRedis {

    @Id
    private String amrId;

    private float x;
    private float y;
    private float direction;

    private int state;
    private int battery;
    private boolean loading;
    private float linearVelocity;

    private int currentNode;
    private String missionId;
    private String missionType;
    private int submissionId;

    private String errorList;

    private String type;//AMR타입

    private float startX;
    private float startY;
    private float targetX;
    private float targetY;

    private int expectedArrival;

    //submissionId, submissionNode, submissionX, submissionY로 구성,JSON
    private List<String> submissionList;
    //지나간 루트를 표시
    //routeId(순서), routeNode, startedAt으로 구성,JSON
    private List<String> routeList;
}
