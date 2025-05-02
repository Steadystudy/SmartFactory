package com.ssafy.flip.domain.log.repository.route;

import com.ssafy.flip.domain.log.entity.Route;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class RouteRepositoryImpl implements RouteRepository {

    private final RouteRepository routeRepository;

    @Override
    public Route save(Route route) {
        return routeRepository.save(route);
    }

    @Override
    public Optional<Route> findById(Long id) {
        return routeRepository.findById(id);
    }
}
