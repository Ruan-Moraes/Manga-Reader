package com.mangareader.application.news.usecase;

import java.time.Clock;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

/**
 * Busca uma notícia pelo ID.
 */
@Service
public class GetNewsByIdUseCase {
    private final NewsRepositoryPort newsRepository;
    private final Clock clock;

    @Autowired
    public GetNewsByIdUseCase(NewsRepositoryPort newsRepository, Clock clock) {
        this.newsRepository = newsRepository;
        this.clock = clock;
    }

    public GetNewsByIdUseCase(NewsRepositoryPort newsRepository) {
        this(newsRepository, Clock.systemUTC());
    }

    public NewsItem execute(String id) {
        return newsRepository.findByIdOrSlug(id)
                .filter(news -> news.getStatus() == NewsStatus.PUBLISHED
                        && news.getPublishedAt() != null
                        && !news.getPublishedAt().isAfter(clock.instant()))
                .orElseThrow(() -> new ResourceNotFoundException("NewsItem", "id", id));
    }
}
