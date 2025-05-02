package com.ssafy.flip.domain.amr.service;

import com.ssafy.flip.domain.amr.entity.AMR;

import java.util.Optional;

public interface AmrService {

    Optional<AMR> findById(String id);

    AMR getById(String id);

}
