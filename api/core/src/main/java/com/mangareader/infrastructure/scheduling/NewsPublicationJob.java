package com.mangareader.infrastructure.scheduling;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.mangareader.application.news.usecase.admin.PublishScheduledNewsUseCase;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class NewsPublicationJob {
    private final PublishScheduledNewsUseCase useCase;

    @Scheduled(cron = "${app.news.publication-cron:0 * * * * *}", zone = "UTC")
    public void publishDueNews() {
        int published = useCase.execute();
        if (published > 0) log.info("{} notícia(s) agendada(s) publicada(s)", published);
    }
}
