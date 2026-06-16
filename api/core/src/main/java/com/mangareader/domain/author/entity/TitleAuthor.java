package com.mangareader.domain.author.entity;

import com.mangareader.domain.author.valueobject.AuthorRole;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Associação entre um título e um autor, com papel (PostgreSQL).
 * <p>
 * Cross-DB reference: o {@code titleId} referencia um documento no MongoDB.
 */
@Entity
@Table(name = "title_authors", uniqueConstraints = {
        @UniqueConstraint(name = "uq_title_authors", columnNames = {"title_id", "author_id", "role"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TitleAuthor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID do Title no MongoDB (cross-DB reference). */
    @Column(name = "title_id", nullable = false, length = 24)
    private String titleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Author author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private AuthorRole role = AuthorRole.AUTHOR;
}
