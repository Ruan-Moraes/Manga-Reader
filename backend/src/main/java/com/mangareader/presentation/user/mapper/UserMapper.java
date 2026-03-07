package com.mangareader.presentation.user.mapper;

import java.util.List;

import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserSocialLink;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.presentation.user.dto.UserProfileResponse;
import com.mangareader.presentation.user.dto.UserProfileResponse.SocialLinkResponse;

/**
 * Mapper estático para converter User entity em UserProfileResponse.
 */
public final class UserMapper {
    private UserMapper() {}

    public static UserProfileResponse toProfileResponse(User user) {
        List<SocialLinkResponse> links = user.getSocialLinks() != null
                ? user.getSocialLinks().stream()
                    .map(UserMapper::toSocialLinkResponse)
                    .toList()
                : List.of();

        return new UserProfileResponse(
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getBio(),
                user.getPhotoUrl(),
                mapRole(user.getRole()),
                links,
                user.getCreatedAt()
        );
    }

    private static SocialLinkResponse toSocialLinkResponse(UserSocialLink link) {
        return new SocialLinkResponse(
                link.getId().toString(),
                link.getPlatform(),
                link.getUrl()
        );
    }

    private static String mapRole(UserRole role) {
        return switch (role) {
            case ADMIN -> "admin";
            case MODERATOR -> "poster";
            case MEMBER -> "user";
        };
    }
}
