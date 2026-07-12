package com.mangareader.application.news.usecase.admin;

import java.time.Clock;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional("mongoTransactionManager")
public class ChangeNewsStatusUseCase {
    private final NewsRepositoryPort repository;
    private final Clock clock;

    public NewsItem publish(String id) {
        NewsItem news = get(id);
        news.publish(clock.instant());
        return repository.save(news);
    }

    public NewsItem schedule(String id, Instant scheduledAt) {
        NewsItem news = get(id);
        news.schedule(scheduledAt, clock.instant());
        return repository.save(news);
    }

    public NewsItem moveToDraft(String id) {
        NewsItem news = get(id);
        news.moveToDraft(clock.instant());
        return repository.save(news);
    }

    public NewsItem unpublish(String id) {
        NewsItem news = get(id);
        news.unpublish(clock.instant());
        return repository.save(news);
    }

    private NewsItem get(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("News", "id", id));
    }
}
