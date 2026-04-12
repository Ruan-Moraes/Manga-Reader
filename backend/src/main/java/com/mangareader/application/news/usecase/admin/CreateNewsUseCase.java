package com.mangareader.application.news.usecase.admin;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;

import lombok.RequiredArgsConstructor;

/**
 * Cria uma nova notícia (admin).
 */
@Service
@RequiredArgsConstructor
public class CreateNewsUseCase {
    private final NewsRepositoryPort newsRepository;

    public NewsItem execute(String title, String subtitle, String excerpt,
                            List<String> content, String coverImage, NewsCategory category,
                            List<String> tags, NewsAuthor author, String source,
                            int readTime, boolean isExclusive, boolean isFeatured) {
        NewsItem news = NewsItem.builder()
                .title(title)
                .subtitle(subtitle)
                .excerpt(excerpt)
                .content(content != null ? content : List.of())
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
}
