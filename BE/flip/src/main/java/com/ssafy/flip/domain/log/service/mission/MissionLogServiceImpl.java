package com.ssafy.flip.domain.log.service.mission;

import com.ssafy.flip.domain.amr.service.AmrService;
import com.ssafy.flip.domain.connect.dto.request.RouteTempDTO;
import com.ssafy.flip.domain.log.dto.mission.request.*;
import com.ssafy.flip.domain.log.entity.MissionLog;
import com.ssafy.flip.domain.log.entity.Route;
import com.ssafy.flip.domain.log.repository.mission.MissionLogRepository;
import com.ssafy.flip.domain.log.repository.route.RouteRepository;
import com.ssafy.flip.domain.mission.service.MissionService;
import com.ssafy.flip.domain.node.repository.edge.EdgeRepository;
import com.ssafy.flip.domain.node.repository.node.NodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MissionLogServiceImpl implements MissionLogService {


    private final MissionLogRepository missionLogRepository;
    private final MissionService missionService;
    private final AmrService amrService;
    private final NodeRepository nodeRepository;
    private final EdgeRepository edgeRepository;
    private final RouteRepository routeRepository;

    @Override
    public MissionLog save(MissionLog missionLog) {
        return missionLogRepository.save(missionLog);
    }

    @Override
    public Optional<MissionLog> findById(Long id) {
        return missionLogRepository.findById(id);
    }

    @Override
    public MissionLog getMissionLog(Long id) {
        return missionLogRepository.findById(id)
                .orElseThrow();
    }

    @Override
    public MissionLog addMissionLog(AddMissionLogRequestDTO requestDTO) {
        MissionLog missionLog = MissionLog.builder()
                .mission(missionService.getMission(requestDTO.missionId()))
                .amr(amrService.getById(requestDTO.amrId()))
                .startedAt(requestDTO.startedAt())
                .endedAt(requestDTO.endedAt())
                .build();

        return missionLogRepository.save(missionLog);
    }

    @Override
    public MissionLog saveWithRoutes(String amrId, String missionId, List<RouteTempDTO> routes) {
        MissionLog log = missionLogRepository.save(
                MissionLog.builder()
                        .mission(missionService.getMission(String.valueOf(missionId)))
                        .amr(amrService.getById(amrId))
                        .startedAt(routes.get(0).startedAt())
                        .endedAt(routes.get(routes.size() - 1).endedAt())
                        .build()
        );

        for (RouteTempDTO r : routes) {
            routeRepository.save(
                    Route.builder()
                            .missionLog(log)
                            .nodeId(nodeRepository.getReferenceById(r.nodeId()))
                            .edgeId(edgeRepository.getReferenceById(r.edgeId()))
                            .startedAt(r.startedAt())
                            .endedAt(r.endedAt())
                            .build()
            );
        }

        return log;
    }
}
