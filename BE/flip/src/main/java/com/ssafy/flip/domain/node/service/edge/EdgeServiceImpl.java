package com.ssafy.flip.domain.node.service.edge;

import com.ssafy.flip.domain.node.entity.Edge;
import com.ssafy.flip.domain.node.repository.edge.EdgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EdgeServiceImpl implements EdgeService {

    private final EdgeRepository edgeRepository;

    @Override
    public List<Edge> findAll() {
        return edgeRepository.findAll();
    }

    @Override
    public Optional<Edge> findById(Integer edgeId) {
        return edgeRepository.findById(edgeId);
    }

    @Override
    public Edge getEdge(Integer edgeId) {
        return edgeRepository.findById(edgeId)
                .orElseThrow();
    }
}
