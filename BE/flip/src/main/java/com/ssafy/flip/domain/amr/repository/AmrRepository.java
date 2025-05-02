package com.ssafy.flip.domain.amr.repository;

import com.ssafy.flip.domain.amr.entity.AMR;

import java.util.Optional;

public interface AmrRepository {
    Optional<AMR> findById(String id);
}
