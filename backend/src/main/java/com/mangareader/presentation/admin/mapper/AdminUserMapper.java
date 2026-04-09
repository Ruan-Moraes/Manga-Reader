package com.mangareader.presentation.admin.mapper;

import com.mangareader.domain.user.entity.User;
import com.mangareader.presentation.admin.dto.AdminUserResponse;

/**
 * Mapper estático User → AdminUserResponse.
 */
public final class AdminUserMapper {

    private AdminUserMapper() {
    }

    public static AdminUserResponse toResponse(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhotoUrl(),
                user.getRole().name(),
                user.isBanned(),
                user.getBannedAt(),
                user.getBannedReason(),
                user.getBannedUntil(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
