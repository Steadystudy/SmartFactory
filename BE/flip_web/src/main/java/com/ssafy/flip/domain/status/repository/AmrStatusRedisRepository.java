package com.ssafy.flip.domain.status.repository;

import com.ssafy.flip.domain.status.entity.AmrStatusRedis;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;
import org.springframework.data.repository.CrudRepository;

@EnableRedisRepositories
public interface AmrStatusRedisRepository extends CrudRepository<AmrStatusRedis, String> {
}
