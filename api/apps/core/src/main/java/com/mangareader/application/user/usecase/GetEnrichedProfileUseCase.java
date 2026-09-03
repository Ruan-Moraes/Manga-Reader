package com.mangareader.application.user.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.manga.service.AdultContentAccessPolicy;
import com.mangareader.application.review.port.ReviewRepositoryPort;
import com.mangareader.application.social.port.SocialGraphPort;
import com.mangareader.application.social.port.SocialGraphPort.ProfileSocial;
import com.mangareader.application.user.port.RecommendationRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.entity.UserRecommendation;
import com.mangareader.domain.user.entity.ViewHistory;
import com.mangareader.domain.user.valueobject.AdultContentPreference;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Orquestrador principal do perfil enriquecido.
 * <p>
 * Aplica lógica de privacidade: se viewer != owner, respeita commentVisibility
 * e viewHistoryVisibility (retorna null para seções privadas).
 */
@Service
@RequiredArgsConstructor
public class GetEnrichedProfileUseCase {
    private final UserRepositoryPort userRepository;
    private final CommentRepositoryPort commentRepository;
    private final ReviewRepositoryPort reviewRepository;
    private final LibraryRepositoryPort libraryRepository;
    private final RecommendationRepositoryPort recommendationRepository;
    private final ViewHistoryRepositoryPort viewHistoryRepository;
    private final UserProfileSettingsResolver profileSettingsResolver;
    private final SocialGraphPort socialGraph;
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultContentPolicy;

    public record EnrichedProfile(
            User user,
            ProfileStats stats,
            List<UserRecommendation> recommendations,
            List<Comment> recentComments,
            List<ViewHistory> recentHistory,
            VisibilitySetting commentVisibility,
            VisibilitySetting viewHistoryVisibility,
            VisibilitySetting libraryVisibility,
            AdultContentPreference adultContentPreference,
            boolean behaviorAnalyticsEnabled,
            ProfileSocial social,
            boolean isOwner
    ) {}

    public record ProfileStats(
            long commentsCount,
            long ratingsCount,
            long libraryTotal,
            long lendo,
            long queroLer,
            long concluido
    ) {}

    @Transactional(readOnly = true)
    public EnrichedProfile execute(UUID targetUserId, UUID viewerUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        // Force lazy initialization — collections will be accessed by the mapper
        // after this method returns (outside the transaction/session)
        user.getSocialLinks().size();
        user.getRecommendations().size();

        boolean isOwner = viewerUserId != null && viewerUserId.equals(targetUserId);
        UserProfileSettings settings = profileSettingsResolver.getOrDefault(user);

        String userIdStr = targetUserId.toString();

        long commentsCount = commentRepository.countByUserIdAndTargetType(userIdStr, CommentTarget.TITLE);
        long ratingsCount = reviewRepository.countByUserId(userIdStr);
        long lendo = libraryRepository.countByUserIdAndList(targetUserId, ReadingListType.LENDO);
        long queroLer = libraryRepository.countByUserIdAndList(targetUserId, ReadingListType.QUERO_LER);
        long concluido = libraryRepository.countByUserIdAndList(targetUserId, ReadingListType.CONCLUIDO);

        ProfileStats stats = new ProfileStats(commentsCount, ratingsCount,
                lendo + queroLer + concluido, lendo, queroLer, concluido);

        List<UserRecommendation> recommendations = recommendationRepository.findByUserIdOrderByPosition(targetUserId);

        List<Comment> recentComments = null;

        if (isOwner || settings.getCommentVisibility() == VisibilitySetting.PUBLIC) {
            var page = commentRepository.findByUserIdAndTargetType(userIdStr, CommentTarget.TITLE,
                    PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")));

            recentComments = page.getContent();
        }

        List<ViewHistory> recentHistory = null;

        if (settings.getViewHistoryVisibility() != VisibilitySetting.DO_NOT_TRACK
                && (isOwner || settings.getViewHistoryVisibility() == VisibilitySetting.PUBLIC)) {
            var page = viewHistoryRepository.findByUserIdOrderByViewedAtDesc(userIdStr,
                    PageRequest.of(0, 10));

            recentHistory = page.getContent();
        }

        java.util.Set<String> referencedTitleIds = new java.util.HashSet<>();
        recommendations.forEach(item -> referencedTitleIds.add(item.getTitleId()));
        if (recentHistory != null) recentHistory.forEach(item -> referencedTitleIds.add(item.getTitleId()));
        java.util.Map<String, Boolean> adultByTitle = titleRepository.findByIds(referencedTitleIds).stream()
                .collect(java.util.stream.Collectors.toMap(com.mangareader.domain.manga.entity.Title::getId,
                        com.mangareader.domain.manga.entity.Title::isAdult, (left, right) -> left));
        recommendations.forEach(item -> item.setAdult(adultByTitle.getOrDefault(item.getTitleId(), false)));
        if (recentHistory != null) recentHistory.forEach(item -> item.setAdult(adultByTitle.getOrDefault(item.getTitleId(), false)));
        if (adultContentPolicy.mustExcludeAdult(viewerUserId)) {
            recommendations = recommendations.stream().filter(item -> !item.isAdult()).toList();
            if (recentHistory != null) recentHistory = recentHistory.stream().filter(item -> !item.isAdult()).toList();
        }

        // DT-48: contagens + isFollowedByMe em 1 round-trip no grafo
        ProfileSocial social = socialGraph.getProfileSocial(targetUserId, viewerUserId);

        return new EnrichedProfile(
                user, stats, recommendations, recentComments, recentHistory,
                settings.getCommentVisibility(), settings.getViewHistoryVisibility(),
                settings.getLibraryVisibility(), settings.getAdultContentPreference(),
                settings.isBehaviorAnalyticsEnabled(),
                social, isOwner
        );
    }
}
