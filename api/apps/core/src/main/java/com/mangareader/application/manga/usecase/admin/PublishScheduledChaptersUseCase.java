package com.mangareader.application.manga.usecase.admin;

import java.time.Clock;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.domain.manga.valueobject.ChapterStatus;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PublishScheduledChaptersUseCase {
    private final ChapterRepositoryPort repository;
    private final Clock clock;

    @Transactional("mongoTransactionManager")
    public int execute() {
        var now = clock.instant();
        var publishable = repository.findScheduledBefore(now).stream()
                .filter(chapter -> chapter.hasReadyPages())
                .toList();
        publishable.forEach(chapter -> {
            chapter.setStatus(ChapterStatus.PUBLISHED);
            chapter.setPublishedAt(now);
            chapter.setScheduledAt(null);
            chapter.setUpdatedAt(now);
        });
        repository.saveAll(publishable);
        return publishable.size();
    }
}
