package com.ssafy.flip.domain.node.repository.edge;

import com.ssafy.flip.domain.node.entity.Edge;

import java.util.List;

public interface EdgeRepository {

    List<Edge> findAll();

}
