package com.mangareader.presentation.user.mapper;

import java.util.List;

import com.mangareader.application.user.usecase.GetEnrichedProfileUseCase.EnrichedProfile;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserRecommendation;
import com.mangareader.domain.user.entity.UserSocialLink;
import com.mangareader.domain.user.entity.ViewHistory;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.presentation.user.dto.EnrichedProfileResponse;
import com.mangareader.presentation.user.dto.EnrichedProfileResponse.CommentSummaryResponse;
import com.mangareader.presentation.user.dto.EnrichedProfileResponse.PrivacySettingsResponse;
import com.mangareader.presentation.user.dto.EnrichedProfileResponse.ProfileStatsResponse;
import com.mangareader.presentation.user.dto.EnrichedProfileResponse.RecommendationResponse;
import com.mangareader.presentation.user.dto.EnrichedProfileResponse.ViewHistoryItemResponse;
import com.mangareader.presentation.user.dto.UserProfileResponse;

/**
 * Mapper estático para converter User entity em UserProfileResponse.
 */
public final class UserMapper {
    private UserMapper() {}

    public static UserProfileResponse toProfileResponse(User user) {
        List<UserProfileResponse.SocialLinkResponse> links = user.getSocialLinks() != null
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

    public static EnrichedProfileResponse toEnrichedProfileResponse(EnrichedProfile profile) {
        User user = profile.user();

        boolean isOwner = profile.isOwner();

        List<EnrichedProfileResponse.SocialLinkResponse> socialLinks = user.getSocialLinks() != null
                ? user.getSocialLinks().stream()
                    .map(sl -> new EnrichedProfileResponse.SocialLinkResponse(
                            sl.getId().toString(), sl.getPlatform(), sl.getUrl()))
                    .toList()
                : List.of();

        ProfileStatsResponse stats = new ProfileStatsResponse(
                profile.stats().commentsCount(),
                profile.stats().ratingsCount(),
                profile.stats().libraryTotal(),
                profile.stats().lendo(),
                profile.stats().queroLer(),
                profile.stats().concluido()
        );

        List<RecommendationResponse> recommendations = profile.recommendations() != null
                ? profile.recommendations().stream()
                    .map(UserMapper::toRecommendationResponse)
                    .toList()
                : List.of();

        List<CommentSummaryResponse> recentComments = profile.recentComments() != null
                ? profile.recentComments().stream()
                    .map(UserMapper::toCommentSummaryResponse)
                    .toList()
                : null;

        List<ViewHistoryItemResponse> recentHistory = profile.recentHistory() != null
                ? profile.recentHistory().stream()
                    .map(UserMapper::toViewHistoryItemResponse)
                    .toList()
                : null;

        PrivacySettingsResponse privacySettings = isOwner
                ? new PrivacySettingsResponse(
                        profile.commentVisibility().name(),
                        profile.viewHistoryVisibility().name())
                : null;

        return new EnrichedProfileResponse(
                user.getId().toString(),
                user.getName(),
                isOwner ? user.getEmail() : null,
                user.getBio(),
                user.getPhotoUrl(),
                user.getBannerUrl(),
                mapRole(user.getRole()),
                socialLinks,
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null,
                stats,
                recommendations,
                recentComments,
                recentHistory,
                privacySettings,
                isOwner
        );
    }

    private static UserProfileResponse.SocialLinkResponse toSocialLinkResponse(UserSocialLink link) {
        return new UserProfileResponse.SocialLinkResponse(
                link.getId().toString(),
                link.getPlatform(),
                link.getUrl()
        );
    }

    private static RecommendationResponse toRecommendationResponse(UserRecommendation rec) {
        return new RecommendationResponse(
                rec.getTitleId(),
                rec.getTitleName(),
                rec.getTitleCover(),
                rec.getPosition()
        );
    }

    private static CommentSummaryResponse toCommentSummaryResponse(Comment comment) {
        return new CommentSummaryResponse(
                comment.getId(),
                comment.getTitleId(),
                comment.getTextContent(),
                comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null
        );
    }

    private static ViewHistoryItemResponse toViewHistoryItemResponse(ViewHistory vh) {
        return new ViewHistoryItemResponse(
                vh.getTitleId(),
                vh.getTitleName(),
                vh.getTitleCover(),
                vh.getViewedAt() != null ? vh.getViewedAt().toString() : null
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
