package com.toonlira.domain.user.entity.activity;

public record UserFollowedPayload(FollowTargetType targetType, String targetId, String targetName, String targetAvatar)
        implements ActivityPayload {
}
