package com.mangareader.aggregator.scheduling;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.mangareader.aggregator.application.RecalculateTitleRatingUseCase;
import com.mangareader.aggregator.infrastructure.repository.RatingAggregationDao;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Rede de segurança contra eventos perdidos: recalcula periodicamente o
 * agregado de todos os títulos que possuem avaliações.
 * <p>
 * A lógica fica em {@link #reconcile()} (testável sem o agendador).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TitleRatingReconciliationJob {
    private final RatingAggregationDao ratingAggregationDao;
    private final RecalculateTitleRatingUseCase recalculateTitleRating;

    @Scheduled(cron = "${aggregator.reconciliation.cron:0 0 3 * * *}")
    public void scheduledReconcile() {
        int count = reconcile();

        log.info("Rating reconciliation finished — {} titles recalculated", count);
    }

    /**
     * Recalcula o agregado de cada título com avaliações. Retorna a quantidade
     * de títulos processados.
     */
    public int reconcile() {
        List<String> titleIds = ratingAggregationDao.distinctRatedTitleIds();

        for (String titleId : titleIds) {
            recalculateTitleRating.execute(titleId);
        }

        return titleIds.size();
    }
}
