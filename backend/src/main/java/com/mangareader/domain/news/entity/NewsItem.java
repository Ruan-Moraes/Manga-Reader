package com.mangareader.domain.news.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsReaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Notícia da plataforma (MongoDB).
 * <p>
 * Compatível com o frontend ({@code NewsItem} em news.types.ts).
 */
@Document(collection = "news")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsItem {

    @Id
    private String id;

    @TextIndexed(weight = 10)
    private String title;

    private String subtitle;

    @TextIndexed(weight = 3)
    private String excerpt;

    @Builder.Default
    private List<String> content = new ArrayList<>();

    private String coverImage;

    @Builder.Default
    private List<String> gallery = new ArrayList<>();

    private String source;
    private String sourceLogo;

    @Indexed
    private NewsCategory category;

    @Indexed
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private NewsAuthor author;

    @CreatedDate
    private LocalDateTime publishedAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder.Default
    private int readTime = 0;

    @Builder.Default
    private int views = 0;

    @Builder.Default
    private int commentsCount = 0;

    @Builder.Default
    private int trendingScore = 0;

    @Builder.Default
    private boolean isExclusive = false;

    @Builder.Default
    private boolean isFeatured = false;

    private String videoUrl;

    @Builder.Default
    private Map<String, String> technicalSheet = new HashMap<>();

    @Builder.Default
    private NewsReaction reactions = new NewsReaction();
}
