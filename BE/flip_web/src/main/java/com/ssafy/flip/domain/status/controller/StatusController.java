package com.ssafy.flip.domain.status.controller;

import com.ssafy.flip.domain.status.dto.request.*;
import com.ssafy.flip.domain.status.dto.response.*;
import com.ssafy.flip.domain.status.service.StatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/status")
@Tag(name = "Control Controller", description = "관제 관련 API")
@Slf4j
public class StatusController {

    private final StatusService statusService;

    @PostMapping("/amr/save")
    public ResponseEntity<Object> saveAmr(@RequestBody AmrSaveRequestDTO requestDTO){
        statusService.saveAmr(requestDTO);
        return ResponseEntity.ok(null);
        //return ResponseEntity.ok(new AmrMissionResponseDTO("AMR001", 0, 1, "MOVING", 2, "ERROR01", LocalDateTime.now(), "TYPE001", (float) 3.14, (float) 3.14, (float) 71.5, (float) 65.5, 620));
    }

    @Operation(summary = "amr mission status", description = "AMR이 Mission을 받았을 때의 최초 상태")
    @GetMapping("/amr/mission")
    public ResponseEntity<List<AmrMissionResponseDTO>> getAmrMissionStatus(@ModelAttribute AmrMissionRequestDTO requestDTO){
        return ResponseEntity.ok(statusService.getAmrMissionStatus(requestDTO));
    }

    @Operation(summary = "amr real time status", description = "AMR 실시간 상태")
    @GetMapping("/amr/realtime")
    public ResponseEntity<AmrRealTimeResponseDTO> getAmrRealTimeStatus(){
        return ResponseEntity.ok(statusService.getAmrRealTimeStatus());
    }

    @Operation(summary = "route status", description = "미션 세부 루트 확인")
    @GetMapping("amr/route/{amrId}")
    public ResponseEntity<MissionStatusResponseDTO> getRouteStatus(@PathVariable("amrId") String amrId){
        return ResponseEntity.ok(statusService.getRouteStatus(amrId));
    }

    @Operation(summary = "line status", description = "라인 상태")
    @GetMapping("/line")
    public ResponseEntity<LineStatusResponseDTO> getLineStatus(){
        return ResponseEntity.ok(new LineStatusResponseDTO(1L, 10, true, LocalDateTime.now()));
    }

    @Operation(summary = "factory status", description = "공장 현재 상태 확인")
    @GetMapping("/factory")
    public ResponseEntity<FactoryStatusResponseDTO> getFactoryStatus(){
        return ResponseEntity.ok(statusService.getFactoryStatus());
    }
}
