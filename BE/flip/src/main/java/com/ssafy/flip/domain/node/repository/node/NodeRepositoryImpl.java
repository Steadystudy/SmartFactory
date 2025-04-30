package com.ssafy.flip.domain.node.repository.node;

import com.ssafy.flip.domain.node.entity.Node;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class NodeRepositoryImpl implements NodeRepository {

    private final NodeJpaRepository nodeJpaRepository;

    @Override
    public List<Node> findAll() {
        return nodeJpaRepository.findAll();
    }
}
