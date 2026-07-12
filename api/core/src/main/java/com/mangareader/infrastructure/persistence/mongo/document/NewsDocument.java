package com.mangareader.infrastructure.persistence.mongo.document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

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

@Document(collection = "news")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsDocument {
    @Id private String id;
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
    private int readTime;
    private int views;
    private int commentsCount;
    private int trendingScore;
    private boolean isExclusive;
    private boolean isFeatured;
    private String videoUrl;
    @Builder.Default private Map<String, String> technicalSheet = new HashMap<>();
    @Builder.Default private NewsReaction reactions = new NewsReaction();
}
