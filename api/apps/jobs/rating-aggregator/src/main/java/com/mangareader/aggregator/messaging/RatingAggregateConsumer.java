package com.mangareader.aggregator.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.mangareader.aggregator.application.RecalculateTitleRatingUseCase;
import com.mangareader.aggregator.config.RabbitMQConfig;
import com.mangareader.application.shared.event.RatingEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Consome eventos {@code rating.*} (submit/update/delete) e recalcula o
 * agregado do título afetado.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RatingAggregateConsumer {
    private final RecalculateTitleRatingUseCase recalculateTitleRating;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_RATING_AGGREGATE)
    public void onRatingEvent(RatingEvent event) {
        log.info("Rating event received for title {}", event.titleId());

        recalculateTitleRating.execute(event.titleId());
    }
}
