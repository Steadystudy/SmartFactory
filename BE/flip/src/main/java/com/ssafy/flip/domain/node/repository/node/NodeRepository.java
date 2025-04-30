package com.ssafy.flip.domain.node.repository.node;

import com.ssafy.flip.domain.node.entity.Node;

import java.util.List;

public interface NodeRepository {

    List<Node> findAll();

}
