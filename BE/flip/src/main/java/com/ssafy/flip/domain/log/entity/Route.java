package com.ssafy.flip.domain.log.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PROTECTED)
@Entity
@EqualsAndHashCode(of = "routeId")
@Table
public class Route {

    @Id
    @Column(name = "route_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long routeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_log_id", nullable = false)
    private MissionLog missionlog;

    @Column(name = "node_id", nullable = false)
    private Integer nodeId;

    @Column(name = "edge_id", nullable = false)
    private Integer edgeId;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at", nullable = false)
    private LocalDateTime endedAt;

    public void updateStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public void updateEndedAt(LocalDateTime endedAt){
        this.endedAt = endedAt;
    }
}
