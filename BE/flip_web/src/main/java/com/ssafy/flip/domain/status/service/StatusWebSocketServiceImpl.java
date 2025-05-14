package com.ssafy.flip.domain.status.service;

import com.ssafy.flip.domain.status.dto.response.*;
import com.ssafy.flip.domain.status.entity.AmrStatusRedis;
import com.ssafy.flip.domain.status.entity.LineStatusRedis;
import com.ssafy.flip.domain.status.repository.AmrStatusRedisManualRepository;
import com.ssafy.flip.domain.status.repository.LineStatusRedisManualRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatusWebSocketServiceImpl implements StatusWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final AmrStatusRedisManualRepository amrStatusRedisManualRepository;
    private final LineStatusRedisManualRepository lineStatusRedisManualRepository;
    private final MissionService missionService;

    private final Map<String, ScheduledFuture<?>> scheduledTasks = new ConcurrentHashMap<>();
    private final ThreadPoolTaskScheduler scheduler = initScheduler();

    @Scheduled(fixedRate = 100)
    private void broadcastRealTimeStatus() {
        List<AmrStatusRedis> amrStatusIterable = amrStatusRedisManualRepository.findAllAmrStatus();
        List<AmrRealTimeDTO> amrRealTimeDTOList = new ArrayList<>();

        for (AmrStatusRedis amrStatus : amrStatusIterable) {
            amrRealTimeDTOList.add(AmrRealTimeDTO.from(amrStatus));
        }

        AmrRealTimeResponseDTO response = new AmrRealTimeResponseDTO(amrRealTimeDTOList);
        messagingTemplate.convertAndSend("/amr/real-time", response);
    }

    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();

        if (Objects.equals(destination, "/amr/mission")) {
            pushMissionStatus();
        }
    }

    @Override
    @Scheduled(fixedRate = 1000)
    public void pushMissionStatus() {
        //미션 저장
        Map<String, AmrMissionDTO> amrMissionMap = missionService.getAmrMission();

        List<AmrMissionResponseDTO> amrMissionResponseDTOS = amrStatusRedisManualRepository.findAllAmrStatus().stream()
                .map(status -> {
                    String rawAmrId = status.getAmrId();
                    String amrId = rawAmrId.startsWith("AMR_STATUS:") ? rawAmrId.substring("AMR_STATUS:".length()) : rawAmrId;
                    AmrMissionDTO missionDTO = amrMissionMap.get(amrId);
                    if(missionDTO == null){
                        missionDTO = new AmrMissionDTO(
                                amrId,
                                "WAITING",
                                0,
                                0,
                                0,
                                0,
                                0,
                                LocalDateTime.now());
                    }
                    return AmrMissionResponseDTO.from(status, missionDTO);
                })
                .sorted(Comparator.comparing(AmrMissionResponseDTO::amrId))
                .toList();

        messagingTemplate.convertAndSend("/amr/mission", amrMissionResponseDTOS);
    }

    @Override
    @Scheduled(fixedRate = 3000)
    public void pushLineStatus() {
        Map<LineStatusRedis, Integer> lineAmountMap = calculateAmount();

        LineStatusResponseDTO responseDTO = LineStatusResponseDTO.from(lineAmountMap);
        messagingTemplate.convertAndSend("/amr/line", responseDTO);
    }

//    @Override
//    @Scheduled(fixedRate = 1000)
//    public void getRouteStatus() {
//        for(int i = 1; i <= 20; i++) {
//            String amrId = String.format("AMR%03d", i);
//            AmrStatusRedis amrStatusRedis = amrStatusRedisManualRepository.findByAmrId(amrId)
//                    .orElseThrow();
//
//            MissionStatusResponseDTO responseDTO = MissionStatusResponseDTO.from(amrStatusRedis);
//            messagingTemplate.convertAndSend("/amr/route" + amrId, responseDTO);
//        }
//    }

    private ThreadPoolTaskScheduler initScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10); // 동시 AMR 수
        scheduler.initialize();
        return scheduler;
    }

    public void getRouteStatus(String amrId) {
        if (scheduledTasks.containsKey(amrId)) return;

        ScheduledFuture<?> future = scheduler.scheduleAtFixedRate(() -> {
            amrStatusRedisManualRepository.findByAmrId(amrId).ifPresent(status -> {
                MissionStatusResponseDTO dto = MissionStatusResponseDTO.from(status);
                messagingTemplate.convertAndSend("/amr/route/" + amrId, dto);
            });
        }, 500); // 0.5초 간격

        scheduledTasks.put(amrId, future);
    }

    public void stopPushing(String amrId) {
        ScheduledFuture<?> future = scheduledTasks.remove(amrId);
        if (future != null) {
            future.cancel(true);
        }
    }

    private Map<LineStatusRedis, Integer> calculateAmount() {
        List<LineStatusRedis> lineList = lineStatusRedisManualRepository.findAllLineStatus();
        Map<LineStatusRedis, Integer> amountMap = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();
        int maxAmount = 100;

        for(LineStatusRedis lineStatusRedis : lineList){
            long elapsedSeconds = java.time.Duration.between(lineStatusRedis.getLastInputTime(), now).getSeconds();
            float cycleTime = lineStatusRedis.getCycleTime() * 10;

            double ratio = (double) elapsedSeconds / cycleTime;
            int amount = 0;
            if(ratio > 0) {
                amount = (int) Math.min(maxAmount, Math.floor((1 - ratio) * maxAmount));
            }
            if(amount < 0) amount = 0;

            amountMap.put(lineStatusRedis, amount);
        }
        return amountMap.entrySet()
                .stream()
                .sorted(Comparator.comparing(e -> e.getKey().getLineId()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }
}
