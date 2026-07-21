package com.mangareader.application.news.usecase.admin;

import java.time.Clock;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.news.port.NewsRepositoryPort;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PublishScheduledNewsUseCase {
    private final NewsRepositoryPort repository;
    private final Clock clock;

    @Transactional("mongoTransactionManager")
    public int execute() {
        var now = clock.instant();
        var due = repository.findScheduledBefore(now);
        due.forEach(news -> news.publish(now));
        repository.saveAll(due);
        return due.size();
    }
}
