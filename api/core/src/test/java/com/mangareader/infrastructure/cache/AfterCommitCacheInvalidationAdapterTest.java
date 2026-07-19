package com.mangareader.infrastructure.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

import static org.mockito.Mockito.mock;

class AfterCommitCacheInvalidationAdapterTest {
    private final CacheManager cacheManager = mock(CacheManager.class);
    private final Cache cache = mock(Cache.class);
    private final SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
    private final AfterCommitCacheInvalidationAdapter adapter =
            new AfterCommitCacheInvalidationAdapter(cacheManager, meterRegistry);

    @AfterEach
    void cleanupSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        meterRegistry.close();
    }

    @Test
    void invalidatesImmediatelyOutsideTransaction() {
        when(cacheManager.getCache("title")).thenReturn(cache);

        adapter.evictAfterCommit("title", "id-1");

        verify(cache).evictIfPresent("id-1");
        assertThat(counter("title", "success")).isEqualTo(1);
    }

    @Test
    void waitsForCommitAndDoesNothingOnRollback() {
        when(cacheManager.getCache("title")).thenReturn(cache);
        TransactionSynchronizationManager.initSynchronization();

        adapter.evictAfterCommit("title", "id-1");
        var callbacks = TransactionSynchronizationManager.getSynchronizations();

        verify(cache, never()).evictIfPresent("id-1");
        callbacks.forEach(callback -> callback.afterCompletion(1));
        verify(cache, never()).evictIfPresent("id-1");
    }

    @Test
    void invalidatesOnlyAfterSuccessfulCommit() {
        when(cacheManager.getCache("plans")).thenReturn(cache);
        TransactionSynchronizationManager.initSynchronization();

        adapter.clearAfterCommit("plans");
        var callbacks = TransactionSynchronizationManager.getSynchronizations();
        verify(cache, never()).clear();

        callbacks.forEach(callback -> callback.afterCommit());

        verify(cache).clear();
        assertThat(counter("plans", "success")).isEqualTo(1);
    }

    @Test
    void cacheFailureAfterCommitIsObservableAndDoesNotEscape() {
        when(cacheManager.getCache("title")).thenReturn(cache);
        doThrow(new IllegalStateException("redis unavailable")).when(cache).evictIfPresent("id-1");

        adapter.evictAfterCommit("title", "id-1");

        assertThat(counter("title", "failure")).isEqualTo(1);
    }

    private double counter(String cacheName, String result) {
        return meterRegistry.counter("mangahost.cache.invalidation",
                "cache", cacheName, "result", result).count();
    }
}
