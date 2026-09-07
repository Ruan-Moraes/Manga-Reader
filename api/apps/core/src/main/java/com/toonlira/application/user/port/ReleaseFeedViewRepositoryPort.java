package com.toonlira.application.user.port;

import java.time.Instant;
import java.util.Collection;
import java.util.Set;

public interface ReleaseFeedViewRepositoryPort {
    Set<String> findSeenChapterIds(String userId, Collection<String> chapterIds);

    void markSeen(String userId, String chapterId, Instant seenAt);

    long markSeen(String userId, Collection<String> chapterIds, Instant seenAt);

    void deleteByChapterId(String chapterId);

    void deleteAllByUserId(String userId);
}
