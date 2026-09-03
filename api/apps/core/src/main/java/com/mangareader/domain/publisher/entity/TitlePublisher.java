package com.mangareader.domain.publisher.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Associação entre um título e uma editora (PostgreSQL).
 * <p>
 * Cross-DB reference: o {@code titleId} referencia um documento no MongoDB.
 */
@Entity
@Table(name = "title_publishers", uniqueConstraints = {
        @UniqueConstraint(name = "uq_title_publishers", columnNames = {"title_id", "publisher_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TitlePublisher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID do Title no MongoDB (cross-DB reference). */
    @Column(name = "title_id", nullable = false, length = 24)
    private String titleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publisher_id", nullable = false)
    private Publisher publisher;
}
