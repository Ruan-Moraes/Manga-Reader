package com.mangareader.trending.scheduling;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.mangareader.trending.application.RecalculateTrendingUseCase;
@Component
public class TrendingAggregationJob {
    private final RecalculateTrendingUseCase useCase;
    public TrendingAggregationJob(RecalculateTrendingUseCase useCase) { this.useCase = useCase; }
    @Scheduled(cron = "${trending.schedule.cron}", zone = "${trending.zone:UTC}")
    public void run() { useCase.execute(); }
}
