package com.mangareader.domain.manga.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Título de mangá/manhwa/manhua (MongoDB).
 * <p>
 * Nota, contagem e ranking <b>não</b> ficam aqui: são consolidados pelo serviço
 * {@code rating-aggregator} na coleção {@code title_rating_aggregate} (fonte
 * única de leitura). Ver {@code TitleRatingAggregateReadPort}.
 */
@Document(collection = "titles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Title {
    @Id
    private String id;

    private String type;

    @Builder.Default
    private LocalizedString name = LocalizedString.empty();

    private String cover;

    @Builder.Default
    private LocalizedString synopsis = LocalizedString.empty();

    @Indexed
    @Builder.Default
    private List<String> genres = new ArrayList<>();

    @Indexed
    private String popularity;

    @Builder.Default
    private boolean adult = false;

    @Indexed
    private String status;

    private String author;

    private String artist;
    private String publisher;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
