package com.ssafy.flip.domain.log.repository;

import com.ssafy.flip.domain.log.entity.MissionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MissionLogJpaRepository extends JpaRepository<MissionLog, Long> {

    List<MissionLog> findAll();

    Optional<MissionLog> findById(Long id);

    @Query("""
    SELECT m FROM MissionLog m
    JOIN m.mission mi
    WHERE m.endedAt >= :startTime
    AND mi.missionType <> 'MOVING'
    """)
    List<MissionLog> findByEndedAtBefore(LocalDateTime startTime);
}
