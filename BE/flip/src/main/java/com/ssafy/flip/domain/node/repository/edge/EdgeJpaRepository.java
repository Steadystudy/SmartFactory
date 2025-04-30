package com.ssafy.flip.domain.node.repository.edge;

import com.ssafy.flip.domain.node.entity.Edge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EdgeJpaRepository extends JpaRepository<Edge, Integer> {

    List<Edge> findAll();

}
