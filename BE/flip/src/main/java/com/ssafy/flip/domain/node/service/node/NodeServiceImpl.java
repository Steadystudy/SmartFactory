package com.ssafy.flip.domain.node.service.node;

import com.ssafy.flip.domain.node.entity.Node;
import com.ssafy.flip.domain.node.repository.node.NodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NodeServiceImpl implements NodeService {

    private final NodeRepository nodeRepository;

    @Override
    public List<Node> findAll() {
        return nodeRepository.findAll();
    }

    @Override
    public Optional<Node> findById(Integer nodeId) {
        return nodeRepository.findById(nodeId);
    }

    @Override
    public Node getNode(Integer nodeId) {
        return nodeRepository.findById(nodeId)
                .orElseThrow();
    }

}
