package com.mangareader.infrastructure.cache;

import org.springframework.cache.CacheManager;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.mangareader.application.shared.port.CacheInvalidationPort;

import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class AfterCommitCacheInvalidationAdapter implements CacheInvalidationPort {
    private final CacheManager cacheManager;
    private final MeterRegistry meterRegistry;

    @Autowired
    public AfterCommitCacheInvalidationAdapter(ObjectProvider<CacheManager> cacheManagers, MeterRegistry meterRegistry) {
        this(cacheManagers.getIfAvailable(), meterRegistry);
    }

    public AfterCommitCacheInvalidationAdapter(CacheManager cacheManager, MeterRegistry meterRegistry) {
        this.cacheManager = cacheManager;
        this.meterRegistry = meterRegistry;
    }

    @Override
    public void evictAfterCommit(String cacheName, Object key) {
        schedule(cacheName, () -> {
            if (cacheManager == null) return;
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) cache.evictIfPresent(key);
        });
    }

    @Override
    public void clearAfterCommit(String cacheName) {
        schedule(cacheName, () -> {
            if (cacheManager == null) return;
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) cache.clear();
        });
    }

    private void schedule(String cacheName, Runnable action) {
        Runnable observed = () -> {
            try {
                action.run();
                meterRegistry.counter("mangahost.cache.invalidation", "cache", cacheName, "result", "success").increment();
            } catch (RuntimeException exception) {
                meterRegistry.counter("mangahost.cache.invalidation", "cache", cacheName, "result", "failure").increment();
                log.warn("Cache invalidation failed after commit: cache={}", cacheName, exception);
            }
        };

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            observed.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                observed.run();
            }
        });
    }
}
