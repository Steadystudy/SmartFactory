package com.ssafy.flip.domain.status.controller;

import com.ssafy.flip.domain.status.dto.request.AmrMissionRequestDTO;
import com.ssafy.flip.domain.status.dto.response.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/v1/status")
@Tag(name = "Control Controller", description = "관제 관련 API")
@Slf4j
public class StatusController {

    @Operation(summary = "amr mission status", description = "AMR이 Mission을 받았을 때의 최초 상태")
    @GetMapping("/amr/mission")
    public ResponseEntity<AmrMissionResponseDTO> getAmrMissionStatus(@ModelAttribute AmrMissionRequestDTO requestDTO){
        return ResponseEntity.ok(new AmrMissionResponseDTO("AMR001", 0, 1, "MOVING", 2, "ERROR01", LocalDateTime.now(), "TYPE001", (float) 3.14, (float) 3.14, (float) 71.5, (float) 65.5, 620));
    }

    @Operation(summary = "amr real time status", description = "AMR 실시간 상태")
    @GetMapping("/amr/realtime")
    public ResponseEntity<AmrRealTimeResponseDTO> getAmrRealTimeStatus(){
        List<AmrRealTimeDTO> amrRealTimes = new ArrayList<>();
        for(int i = 0; i < 8; i++) {
            String amrId = "AMR00" + String.valueOf(i);
            String errorCode = "ERROR0" + String.valueOf(i);
            AmrRealTimeDTO amrRealTimeDTO = new AmrRealTimeDTO(amrId, 2, (float) 3.14*i, (float) 3.14*i, (float) 180.0, 5, true, 4, errorCode);
            amrRealTimes.add(amrRealTimeDTO);
        }

        return ResponseEntity.ok(new AmrRealTimeResponseDTO(amrRealTimes));
    }

    @Operation(summary = "line status", description = "라인 상태")
    @GetMapping("/line")
    public ResponseEntity<LineStatusResponseDTO> getLineStatus(){
        return ResponseEntity.ok(new LineStatusResponseDTO("LINE001", true, LocalDateTime.now()));
    }

    @Operation(summary = "mission status", description = "미션 세부 루트 확인")
    @GetMapping("/mission/{missionId}")
    public ResponseEntity<MissionStatusResponseDTO> getMissionStatus(@PathVariable("missionId") Long missionId){
        List<SubmissionDTO> submissions = new ArrayList<>();
        for(int i = 0; i < 8; i++){
            SubmissionDTO submissionDTO = new SubmissionDTO(i, (float) (i*8.5+3), (float) (i*8.5+10));
            submissions.add(submissionDTO);
        }

        return ResponseEntity.ok(new MissionStatusResponseDTO(submissions));
    }

    @Operation(summary = "factory status", description = "공장 현재 상태 확인")
    @GetMapping("/factory")
    public ResponseEntity<FactoryStatusResponseDTO> getFactoryStatus(){
        return ResponseEntity.ok(new FactoryStatusResponseDTO(
                20, 16, 2, 2, 382, 20, 18, 70000, 100000, LocalDateTime.now()
        ));
    }

}
