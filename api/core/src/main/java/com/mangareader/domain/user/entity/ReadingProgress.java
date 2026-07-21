package com.mangareader.domain.user.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Posição de leitura de um usuário dentro de um capítulo (MongoDB).
 * <p>
 * Cada documento representa "usuário {@code userId} está (ou esteve) na
 * página {@code currentPage} de {@code totalPages} do capítulo
 * {@code chapterNumber} do título {@code titleId}". O índice composto único
 * {@code (userId, titleId, chapterNumber)} garante upsert idempotente e serve
 * de prefixo para a busca do progresso mais recente por (userId, titleId).
 * Estado pessoal ("onde parei") — não é histórico visível a terceiros, por
 * isso não respeita {@code viewHistoryVisibility}, ao contrário de
 * {@link UserChapterRead} e {@link ViewHistory}.
 */
@Document(collection = "reading_progress")
@CompoundIndex(name = "idx_reading_progress_user_title_chapter",
        def = "{'userId': 1, 'titleId': 1, 'chapterNumber': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadingProgress {
    @Id
    private String id;

    private String userId;

    private String titleId;

    private String chapterNumber;

    private int currentPage;

    private int totalPages;

    private boolean completed;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
