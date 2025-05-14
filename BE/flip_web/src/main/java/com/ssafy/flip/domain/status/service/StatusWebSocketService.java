package com.ssafy.flip.domain.status.service;

public interface StatusWebSocketService {

    void pushMissionStatus();

    void pushLineStatus();

    void getRouteStatus(String amrId);

    void stopPushing(String amrId);

//    void getRouteStatus();
}
