package com.mangareader.application.news.usecase;

import java.time.Clock;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

@Service
public class GetRelatedNewsUseCase {
    private final NewsRepositoryPort repository;
    private final Clock clock;

    @Autowired
    public GetRelatedNewsUseCase(NewsRepositoryPort repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public GetRelatedNewsUseCase(NewsRepositoryPort repository) {
        this(repository, Clock.systemUTC());
    }

    public List<NewsItem> execute(String idOrSlug, int limit) {
        NewsItem source = repository.findByIdOrSlug(idOrSlug)
                .filter(news -> news.getStatus() == NewsStatus.PUBLISHED
                        && news.getPublishedAt() != null
                        && !news.getPublishedAt().isAfter(clock.instant()))
                .orElseThrow(() -> new ResourceNotFoundException("News", "id", idOrSlug));
        return repository.findRelated(source, limit);
    }
}
