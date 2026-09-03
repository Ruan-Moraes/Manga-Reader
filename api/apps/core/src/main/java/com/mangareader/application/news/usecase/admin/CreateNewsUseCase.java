package com.mangareader.application.news.usecase.admin;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsSeo;
import com.mangareader.domain.news.valueobject.NewsSlug;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;
import com.mangareader.shared.exception.BusinessRuleException;

@Service
@Transactional("mongoTransactionManager")
public class CreateNewsUseCase {
    private final NewsRepositoryPort newsRepository;
    private final Clock clock;

    @Autowired
    public CreateNewsUseCase(NewsRepositoryPort newsRepository, Clock clock) {
        this.newsRepository = newsRepository;
        this.clock = clock;
    }

    public CreateNewsUseCase(NewsRepositoryPort newsRepository) {
        this(newsRepository, Clock.systemUTC());
    }

    public NewsItem execute(CreateNewsCommand command) {
        Instant now = clock.instant();
        String requestedSlug = command.slug() == null || command.slug().isBlank()
                ? defaultSlug(command.title()) : NewsSlug.from(command.slug());
        String slug = uniqueSlug(requestedSlug, null);
        NewsItem news = NewsItem.builder()
                .slug(slug).title(toLocalized(command.title())).subtitle(toLocalized(command.subtitle()))
                .excerpt(toLocalized(command.excerpt())).content(toLocalizedList(command.content()))
                .coverImage(command.coverImage()).coverAlt(toLocalized(command.coverAlt()))
                .category(command.category()).tags(command.tags() == null ? List.of() : command.tags())
                .author(command.author()).source(command.source()).readTime(command.readTime())
                .isExclusive(command.isExclusive()).isFeatured(command.isFeatured())
                .seo(new NewsSeo(toLocalized(command.seoTitle()), toLocalized(command.seoDescription()),
                        toLocalizedList(command.seoKeywords())))
                .createdAt(now).updatedAt(now).build();
        try {
            return newsRepository.save(news);
        } catch (DuplicateKeyException exception) {
            throw new BusinessRuleException("Slug de notícia já está em uso", 409);
        }
    }

    public NewsItem execute(Map<String, String> title, Map<String, String> subtitle,
                            Map<String, String> excerpt, Map<String, List<String>> content,
                            String coverImage, NewsCategory category, List<String> tags,
                            NewsAuthor author, String source, int readTime,
                            boolean isExclusive, boolean isFeatured) {
        return execute(new CreateNewsCommand(title, subtitle, excerpt, content, null, coverImage,
                null, category, tags, author, source, readTime, isExclusive, isFeatured,
                null, null, null));
    }

    private String uniqueSlug(String base, String id) {
        String candidate = base;
        int suffix = 2;
        while (newsRepository.existsBySlugAndIdNot(candidate, id)) candidate = base + "-" + suffix++;
        return candidate;
    }

    private static String defaultSlug(Map<String, String> title) {
        if (title == null) return "noticia";
        return NewsSlug.from(title.getOrDefault(LocalizedString.DEFAULT_TAG,
                title.values().stream().findFirst().orElse("noticia")));
    }

    private static LocalizedString toLocalized(Map<String, String> map) {
        return map == null || map.isEmpty() ? LocalizedString.empty() : LocalizedString.of(map);
    }

    private static LocalizedStringList toLocalizedList(Map<String, List<String>> map) {
        return map == null || map.isEmpty() ? LocalizedStringList.empty() : LocalizedStringList.of(map);
    }

    public record CreateNewsCommand(
            Map<String, String> title, Map<String, String> subtitle, Map<String, String> excerpt,
            Map<String, List<String>> content, String slug, String coverImage,
            Map<String, String> coverAlt, NewsCategory category, List<String> tags,
            NewsAuthor author, String source, int readTime, boolean isExclusive, boolean isFeatured,
            Map<String, String> seoTitle, Map<String, String> seoDescription,
            Map<String, List<String>> seoKeywords) {}
}
