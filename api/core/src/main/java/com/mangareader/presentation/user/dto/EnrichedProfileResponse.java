package com.mangareader.presentation.user.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response do perfil enriquecido de um usuário.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EnrichedProfileResponse(
        String id,
        String name,
        String username,
        boolean verified,
        String email,
        String bio,
        String photoUrl,
        String bannerUrl,
        String role,
        List<SocialLinkResponse> socialLinks,
        List<String> favoriteGenres,
        String createdAt,
        ProfileStatsResponse stats,
        long followersCount,
        long followingCount,
        boolean isFollowedByMe,
        List<RecommendationResponse> recommendations,
        List<CommentSummaryResponse> recentComments,
        List<ViewHistoryItemResponse> recentViewHistory,
        PrivacySettingsResponse privacySettings,
        boolean isOwner
) {
    public record ProfileStatsResponse(
            long comments,
            long ratings,
            long libraryTotal,
            long lendo,
            long queroLer,
            long concluido
    ) {}

    public record RecommendationResponse(
            String titleId,
            String titleName,
            String titleCover,
            int position
    ) {}

    public record CommentSummaryResponse(
            String id,
            String titleId,
            String textContent,
            String createdAt
    ) {}

    public record ViewHistoryItemResponse(
            String titleId,
            String titleName,
            String titleCover,
            String viewedAt
    ) {}

    public record PrivacySettingsResponse(
            String commentVisibility,
            String viewHistoryVisibility,
            String libraryVisibility,
            String adultContentPreference
    ) {}

    public record SocialLinkResponse(
            String id,
            String platform,
            String url
    ) {}
}
