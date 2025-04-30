package com.ssafy.flip.domain.node.repository.node;

import com.ssafy.flip.domain.node.entity.Edge;
import com.ssafy.flip.domain.node.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NodeJpaRepository extends JpaRepository<Node, Integer> {

    List<Node> findAll();

}
