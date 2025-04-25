package com.ssafy.flip.domain.storage.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder(access = AccessLevel.PROTECTED)
@Entity
@EqualsAndHashCode(of = "storageId")
@Table
public class Storage {
    @Id
    @Column(name = "storage_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer storageId;

    @Column(name = "material_id", nullable = false)
    private Integer materialId;

    @Column(nullable = false)
    private Long amount;
}
