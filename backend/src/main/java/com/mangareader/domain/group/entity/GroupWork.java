package com.mangareader.domain.group.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import com.mangareader.domain.group.valueobject.GroupWorkStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Trabalho traduzido por um grupo (PostgreSQL).
 * <p>
 * Referencia um Title no MongoDB via {@code titleId} (String cross-DB ref).
 */
@Entity
@Table(name = "group_works")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupWork {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    /** ID do Title no MongoDB (cross-DB reference). */
    @Column(name = "title_id", nullable = false)
    private String titleId;

    @Column(nullable = false, length = 200)
    private String title;

    private String cover;

    @Builder.Default
    private int chapters = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private GroupWorkStatus status = GroupWorkStatus.ONGOING;

    @Builder.Default
    private int popularity = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private List<String> genres = new ArrayList<>();

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
