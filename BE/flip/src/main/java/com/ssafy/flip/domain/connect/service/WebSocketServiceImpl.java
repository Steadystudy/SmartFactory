package com.ssafy.flip.domain.connect.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.flip.domain.connect.dto.response.EdgeDTO;
import com.ssafy.flip.domain.connect.dto.response.MapInfoDTO;
import com.ssafy.flip.domain.connect.dto.response.NodeDTO;
import com.ssafy.flip.domain.node.entity.Edge;
import com.ssafy.flip.domain.node.entity.Node;
import com.ssafy.flip.domain.node.service.edge.EdgeService;
import com.ssafy.flip.domain.node.service.node.NodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WebSocketServiceImpl implements WebSocketService {

    private final ObjectMapper objectMapper;
    private final NodeService nodeService;
    private final EdgeService edgeService;

    @Override
    public String sendMapInfo() {
        List<Node> nodeList = nodeService.findAll();
        List<Edge> edgeList = edgeService.findAll();

        // DTO 변환
        List<NodeDTO> nodeDTOs = nodeList.stream()
                .map(NodeDTO::from)
                .toList();

        List<EdgeDTO> edgeDTOs = edgeList.stream()
                .map(EdgeDTO::from)
                .toList();

        // MapInfo 생성
        MapInfoDTO mapInfoDTO = MapInfoDTO.of(nodeDTOs, edgeDTOs);

        // JSON 직렬화
        try {
            return objectMapper.writeValueAsString(mapInfoDTO);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("맵 정보 직렬화 실패", e);
        }
    }
}
