package com.mangareader.domain.news.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.domain.news.valueobject.NewsSeo;
import com.mangareader.domain.news.valueobject.NewsStatus;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Agregado editorial de notícia, sem dependências de framework. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsItem {
    private String id;
    private String slug;

    @Builder.Default private LocalizedString title = LocalizedString.empty();
    @Builder.Default private LocalizedString subtitle = LocalizedString.empty();
    @Builder.Default private LocalizedString excerpt = LocalizedString.empty();
    @Builder.Default private LocalizedStringList content = LocalizedStringList.empty();

    private String coverImage;
    @Builder.Default private LocalizedString coverAlt = LocalizedString.empty();
    @Builder.Default private List<String> gallery = new ArrayList<>();
    private String source;
    private String sourceLogo;
    private NewsCategory category;
    @Builder.Default private List<String> tags = new ArrayList<>();
    private NewsAuthor author;

    @Builder.Default private NewsStatus status = NewsStatus.DRAFT;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant publishedAt;
    private Instant scheduledAt;

    @Builder.Default private NewsSeo seo = NewsSeo.empty();
    @Builder.Default private int readTime = 0;
    @Builder.Default private int views = 0;
    @Builder.Default private int commentsCount = 0;
    @Builder.Default private int trendingScore = 0;
    @Builder.Default private boolean isExclusive = false;
    @Builder.Default private boolean isFeatured = false;
    private String videoUrl;
    @Builder.Default private Map<String, String> technicalSheet = new HashMap<>();
    @Builder.Default private NewsReaction reactions = new NewsReaction();

    public void publish(Instant now) {
        status = NewsStatus.PUBLISHED;
        scheduledAt = null;
        if (publishedAt == null) publishedAt = now;
        updatedAt = now;
    }

    public void schedule(Instant publicationTime, Instant now) {
        if (publicationTime == null || !publicationTime.isAfter(now)) {
            throw new IllegalArgumentException("A data de agendamento deve estar no futuro");
        }
        status = NewsStatus.SCHEDULED;
        scheduledAt = publicationTime;
        updatedAt = now;
    }

    public void moveToDraft(Instant now) {
        status = NewsStatus.DRAFT;
        scheduledAt = null;
        updatedAt = now;
    }

    public void unpublish(Instant now) {
        if (status != NewsStatus.PUBLISHED) {
            throw new IllegalStateException("Somente notícias publicadas podem ser despublicadas");
        }
        status = NewsStatus.UNPUBLISHED;
        scheduledAt = null;
        updatedAt = now;
    }
}
