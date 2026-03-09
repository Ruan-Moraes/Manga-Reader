package com.mangareader.domain.library.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.user.entity.User;

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
 * Mangá salvo na biblioteca do usuário (PostgreSQL).
 * <p>
 * Referencia um Title no MongoDB via {@code titleId} (cross-DB ref).
 * Compatível com o frontend ({@code SavedMangaItem} em saved-library.types.ts).
 */
@Entity
@Table(name = "user_libraries", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "title_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedManga {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** ID do Title no MongoDB (cross-DB reference). */
    @Column(name = "title_id", nullable = false)
    private String titleId;

    /** Nome do title (desnormalizado para performance). */
    @Column(nullable = false, length = 200)
    private String name;

    /** Capa do title (desnormalizada). */
    private String cover;

    /** Tipo do title (Mangá, Manhwa, etc. — desnormalizado). */
    @Column(length = 50)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReadingListType list;

    @Column(name = "saved_at")
    @CreationTimestamp
    private LocalDateTime savedAt;
}
