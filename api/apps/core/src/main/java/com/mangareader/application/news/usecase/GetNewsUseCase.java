package com.mangareader.application.news.usecase;

import java.time.Clock;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsPeriod;

@Service
public class GetNewsUseCase {
    private final NewsRepositoryPort repository;
    private final Clock clock;

    @Autowired
    public GetNewsUseCase(NewsRepositoryPort repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public GetNewsUseCase(NewsRepositoryPort repository) {
        this(repository, Clock.systemUTC());
    }

    public Page<NewsItem> execute(String query, NewsCategory category, NewsPeriod period,
                                  Pageable pageable) {
        var now = clock.instant();
        return repository.findPublished(query, category, period.lowerBound(now), now, pageable);
    }

    public Page<NewsItem> execute(Pageable pageable) {
        return execute(null, null, NewsPeriod.ALL, pageable);
    }
}
