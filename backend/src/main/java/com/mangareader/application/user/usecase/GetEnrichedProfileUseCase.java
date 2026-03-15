package com.mangareader.application.user.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.user.port.RecommendationRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserRecommendation;
import com.mangareader.domain.user.entity.ViewHistory;
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
    private final RatingRepositoryPort ratingRepository;
    private final LibraryRepositoryPort libraryRepository;
    private final RecommendationRepositoryPort recommendationRepository;
    private final ViewHistoryRepositoryPort viewHistoryRepository;

    public record EnrichedProfile(
            User user,
            ProfileStats stats,
            List<UserRecommendation> recommendations,
            List<Comment> recentComments,
            List<ViewHistory> recentHistory,
            VisibilitySetting commentVisibility,
            VisibilitySetting viewHistoryVisibility,
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

        String userIdStr = targetUserId.toString();

        long commentsCount = commentRepository.countByUserId(userIdStr);
        long ratingsCount = ratingRepository.countByUserId(userIdStr);
        long lendo = libraryRepository.countByUserIdAndList(targetUserId, ReadingListType.LENDO);
        long queroLer = libraryRepository.countByUserIdAndList(targetUserId, ReadingListType.QUERO_LER);
        long concluido = libraryRepository.countByUserIdAndList(targetUserId, ReadingListType.CONCLUIDO);

        ProfileStats stats = new ProfileStats(commentsCount, ratingsCount,
                lendo + queroLer + concluido, lendo, queroLer, concluido);

        List<UserRecommendation> recommendations = recommendationRepository.findByUserIdOrderByPosition(targetUserId);

        List<Comment> recentComments = null;

        if (isOwner || user.getCommentVisibility() == VisibilitySetting.PUBLIC) {
            var page = commentRepository.findByUserId(userIdStr,
                    PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")));

            recentComments = page.getContent();
        }

        List<ViewHistory> recentHistory = null;

        if (isOwner || user.getViewHistoryVisibility() == VisibilitySetting.PUBLIC) {
            var page = viewHistoryRepository.findByUserIdOrderByViewedAtDesc(userIdStr,
                    PageRequest.of(0, 10));

            recentHistory = page.getContent();
        }

        return new EnrichedProfile(
                user, stats, recommendations, recentComments, recentHistory,
                user.getCommentVisibility(), user.getViewHistoryVisibility(), isOwner
        );
    }
}
