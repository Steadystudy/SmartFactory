package com.ssafy.flip.domain.node.repository.edge;

import com.ssafy.flip.domain.node.entity.Edge;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class EdgeRepositoryImpl implements EdgeRepository{

    private final EdgeJpaRepository edgeJpaRepository;

    @Override
    public List<Edge> findAll() {
        return edgeJpaRepository.findAll();
    }
}
