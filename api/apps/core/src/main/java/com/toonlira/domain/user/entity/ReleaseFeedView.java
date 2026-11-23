package com.toonlira.domain.user.entity;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Private, explicit "seen in release feed" state.
 *
 * <p>It is intentionally independent from completed chapter reads, activity
 * history and analytics. The natural key is (userId, chapterId).
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReleaseFeedView {
    private String id;

    private String userId;

    private String chapterId;

    private Instant seenAt;

    public Key naturalKey() {
        return new Key(userId, chapterId);
    }

    public record Key(String userId, String chapterId) {
        public Key {
            if (userId == null || userId.isBlank() || chapterId == null || chapterId.isBlank()) {
                throw new IllegalArgumentException("Release feed view key requires userId and chapterId");
            }
        }
    }
}
