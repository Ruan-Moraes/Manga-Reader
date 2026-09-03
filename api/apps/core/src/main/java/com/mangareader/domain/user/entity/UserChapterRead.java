package com.mangareader.domain.user.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Registro de leitura de um capítulo por um usuário (MongoDB).
 * <p>
 * Cada documento representa "usuário {@code userId} leu o capítulo
 * {@code chapterNumber} do título {@code titleId}". O índice composto único
 * {@code (userId, titleId, chapterNumber)} garante idempotência (reler não
 * duplica) e cobre a contagem de capítulos lidos por (userId, titleId).
 * Coleção mantida enxuta: ao contrário de {@code view_history}, não copiamos
 * nome/capa do título — o uso é apenas contar.
 */
@Document(collection = "user_chapter_reads")
@CompoundIndex(name = "idx_user_chapter_reads_user_title_chapter",
        def = "{'userId': 1, 'titleId': 1, 'chapterNumber': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserChapterRead {
    @Id
    private String id;

    private String userId;

    private String titleId;

    private String chapterNumber;

    @CreatedDate
    private LocalDateTime readAt;
}
