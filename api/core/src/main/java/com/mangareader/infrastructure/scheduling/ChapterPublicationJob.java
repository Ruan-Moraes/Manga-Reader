package com.mangareader.infrastructure.scheduling;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.mangareader.application.manga.usecase.admin.PublishScheduledChaptersUseCase;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChapterPublicationJob {
    private final PublishScheduledChaptersUseCase useCase;

    @Scheduled(cron = "${app.chapter.publication-cron:0 * * * * *}", zone = "UTC")
    public void publishDueChapters() {
        int published = useCase.execute();
        if (published > 0) log.info("{} capítulo(s) agendado(s) publicado(s)", published);
    }
}
