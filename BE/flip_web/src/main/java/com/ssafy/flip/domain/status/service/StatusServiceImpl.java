package com.ssafy.flip.domain.status.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.line.entity.Line;
import com.ssafy.flip.domain.line.service.LineService;
import com.ssafy.flip.domain.log.entity.MissionLog;
import com.ssafy.flip.domain.log.service.MissionLogService;
import com.ssafy.flip.domain.status.dto.request.*;
import com.ssafy.flip.domain.status.dto.response.*;
import com.ssafy.flip.domain.status.entity.AmrStatusRedis;
import com.ssafy.flip.domain.status.repository.AmrStatusRedisManualRepository;
import com.ssafy.flip.domain.status.repository.AmrStatusRedisRepository;
import com.ssafy.flip.domain.storage.entity.Storage;
import com.ssafy.flip.domain.storage.service.StorageService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
public class StatusServiceImpl implements StatusService{

    private final AmrStatusRedisManualRepository amrStatusRedisManualRepository;

    private final StorageService storageService;

    private final LineService lineService;

    private final MissionLogService missionLogService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public AmrRealTimeResponseDTO getAmrRealTimeStatus() {
        List<AmrStatusRedis> amrStatusIterable = amrStatusRedisManualRepository.findAllAmrStatus();
        List<AmrRealTimeDTO> amrRealTimeDTOList = new ArrayList<>();

        for (AmrStatusRedis amrStatus : amrStatusIterable) {
            amrRealTimeDTOList.add(AmrRealTimeDTO.from(amrStatus));
        }

        return new AmrRealTimeResponseDTO(amrRealTimeDTOList);
    }

    @Override
    public MissionStatusResponseDTO getRouteStatus(String amrId) {
        AmrStatusRedis amrStatusRedis = amrStatusRedisManualRepository.findByAmrId(amrId)
                .orElseThrow();

        return MissionStatusResponseDTO.from(amrStatusRedis);
    }

    @Override
    public LineStatusResponseDTO getLineStatus() {
        return null;
    }

    @Override
    public FactoryStatusResponseDTO getFactoryStatus() {

        List<AmrStatusRedis> amrStatusIterable = amrStatusRedisManualRepository.findAllAmrStatus();

        Map<Integer, Long> statusCounts = StreamSupport.stream(amrStatusIterable.spliterator(), false)
                .collect(Collectors.groupingBy(AmrStatusRedis::getState, Collectors.counting()));
        int amrWorking = statusCounts.getOrDefault(2, 0L).intValue();
        int amrCharging = statusCounts.getOrDefault(3, 0L).intValue();
        int amrWaiting = statusCounts.getOrDefault(1, 0L).intValue();
        int amrError = statusCounts.getOrDefault(0, 0L).intValue();

        int amrMaxNum = (int) statusCounts.values().stream().mapToLong(Long::longValue).sum();

        //DB에서 시간 들고와서 계산
        //Redis에서 현재 데이터 들고와서 계산
        List<MissionLog> missionLogs = missionLogService.findBefore8hour();

        int amrWorkTime = 0;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime targetTime = LocalDateTime.now().minusHours(8);

        for (MissionLog log : missionLogs) {
            LocalDateTime effectiveStartTime = log.getStartedAt().isBefore(targetTime) ? targetTime : log.getStartedAt();
            LocalDateTime effectiveEndTime = log.getEndedAt().isAfter(now) ? now : log.getEndedAt();
            amrWorkTime += (int) Duration.between(effectiveStartTime, effectiveEndTime).toMinutes();
        }

        for (AmrStatusRedis amr : amrStatusIterable) {
            if(amr.getMissionType().equals("MOVING"))
                continue;

            List<String> routeList = amr.getRouteList();

            if (routeList != null && !routeList.isEmpty()) {
                try {
                    System.out.println(routeList.getFirst());
                    RouteDTO firstRoute = objectMapper.readValue(routeList.getFirst(), RouteDTO.class);
                    LocalDateTime startedAt = LocalDateTime.parse(firstRoute.getStartedAt(), formatter);

                    LocalDateTime effectiveStartTime = startedAt.isBefore(targetTime) ? targetTime : startedAt;

                    amrWorkTime += (int) Duration.between(effectiveStartTime, now).toMinutes();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }

        if(amrMaxNum != 0) {
            amrWorkTime /= amrMaxNum;
        } else {
            amrWorkTime = 0;
        }

        //DB
        List<Line> lines = lineService.findAll();
        int lineMaxNum = lines.size();
        int lineWorking = (int) lines.stream().filter((line) -> line.isStatus()).count();

        //DB
        Storage storage = storageService.getStorage(1L);
        int storageQuantity = storage.getAmount();
        int storageMaxQuantity = storage.getMaxAmount();

        return new FactoryStatusResponseDTO(
                amrMaxNum,
                amrWorking,
                amrWaiting,
                amrCharging,
                amrError,
                amrWorkTime,
                lineMaxNum,
                lineWorking,
                storageQuantity,
                storageMaxQuantity,
                LocalDateTime.now());
    }
}
