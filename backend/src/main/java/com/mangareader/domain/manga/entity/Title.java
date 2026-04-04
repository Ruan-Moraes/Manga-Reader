package com.mangareader.domain.manga.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.domain.manga.valueobject.Chapter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Título de mangá/manhwa/manhua (MongoDB).
 * <p>
 * Campos de rating (ratingAverage, ratingCount, rankingScore) são
 * consolidados por um job periódico a partir das reviews (MangaRating).
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

    @TextIndexed(weight = 10)
    private String name;

    private String cover;

    @TextIndexed(weight = 3)
    private String synopsis;

    @Indexed
    @Builder.Default
    private List<String> genres = new ArrayList<>();

    @Builder.Default
    private List<Chapter> chapters = new ArrayList<>();

    @Indexed
    private String popularity;

    private Double ratingAverage;
    private Long ratingCount;
    private Double rankingScore;

    @Builder.Default
    private boolean adult = false;

    @Indexed
    private String status;

    @TextIndexed(weight = 5)
    private String author;

    private String artist;
    private String publisher;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
