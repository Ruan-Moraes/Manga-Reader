package com.mangareader.infrastructure.messaging.consumer;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.application.shared.event.RatingEvent;
import com.mangareader.shared.config.RabbitMQConfig;
import com.mangareader.shared.constant.CacheNames;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Consumer que reage a eventos de rating (submitted, updated, deleted).
 * <p>
 * Limpa as caches de ratings para o título afetado, forçando
 * recalculação na próxima leitura.
 */
@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class RatingEventConsumer {
    private final CacheManager cacheManager;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_RATING_RECALCULATE)
    public void handleRatingEvent(RatingEvent event) {
        log.info("Received rating event for title: {}", event.titleId());

        evictCache(CacheNames.RATING_AVERAGE, event.titleId());
    }

    private void evictCache(String cacheName, Object key) {
        var cache = cacheManager.getCache(cacheName);

        if (cache != null) {
            cache.evict(key);

            log.debug("Evicted cache [{}] key [{}]", cacheName, key);
        }
    }
}
