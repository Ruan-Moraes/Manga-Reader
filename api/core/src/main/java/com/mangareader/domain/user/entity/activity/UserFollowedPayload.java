package com.mangareader.domain.user.entity.activity;

public record UserFollowedPayload(FollowTargetType targetType, String targetId, String targetName, String targetAvatar)
        implements ActivityPayload {
}
