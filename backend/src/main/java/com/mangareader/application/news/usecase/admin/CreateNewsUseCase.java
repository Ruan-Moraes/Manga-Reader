package com.mangareader.application.news.usecase.admin;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

import lombok.RequiredArgsConstructor;

/**
 * Cria uma nova notícia (admin).
 */
@Service
@RequiredArgsConstructor
public class CreateNewsUseCase {
    private final NewsRepositoryPort newsRepository;

    public NewsItem execute(Map<String, String> title, Map<String, String> subtitle,
                            Map<String, String> excerpt,
                            Map<String, List<String>> content,
                            String coverImage, NewsCategory category,
                            List<String> tags, NewsAuthor author, String source,
                            int readTime, boolean isExclusive, boolean isFeatured) {
        NewsItem news = NewsItem.builder()
                .title(toLocalized(title))
                .subtitle(toLocalized(subtitle))
                .excerpt(toLocalized(excerpt))
                .content(toLocalizedList(content))
                .coverImage(coverImage)
                .category(category)
                .tags(tags != null ? tags : List.of())
                .author(author)
                .source(source)
                .readTime(readTime)
                .isExclusive(isExclusive)
                .isFeatured(isFeatured)
                .build();

        return newsRepository.save(news);
    }

    private static LocalizedString toLocalized(Map<String, String> map) {
        return (map == null || map.isEmpty()) ? LocalizedString.empty() : LocalizedString.of(map);
    }

    private static LocalizedStringList toLocalizedList(Map<String, List<String>> map) {
        return (map == null || map.isEmpty()) ? LocalizedStringList.empty() : LocalizedStringList.of(map);
    }
}
