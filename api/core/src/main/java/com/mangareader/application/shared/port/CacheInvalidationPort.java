package com.mangareader.application.shared.port;

public interface CacheInvalidationPort {
    void evictAfterCommit(String cacheName, Object key);
    void clearAfterCommit(String cacheName);
}
