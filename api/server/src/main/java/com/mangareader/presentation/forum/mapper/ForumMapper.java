package com.mangareader.presentation.forum.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.mangareader.application.forum.port.ForumTopicVoteRepositoryPort;
import com.mangareader.application.forum.usecase.GetAuthorPostCountUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicByIdUseCase.ForumTopicDetail;
import com.mangareader.application.label.service.DomainLabelService;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.entity.ForumTopicVote;
import com.mangareader.domain.user.entity.User;
import com.mangareader.presentation.forum.dto.ForumAuthorResponse;
import com.mangareader.presentation.forum.dto.ForumReplyResponse;
import com.mangareader.presentation.forum.dto.ForumTopicResponse;
import com.mangareader.presentation.forum.dto.ForumTopicSummaryResponse;
import com.mangareader.shared.domain.vote.VoteValue;

import lombok.RequiredArgsConstructor;

/**
 * Monta os DTOs do fórum a partir do tópico Mongo (autor em snapshot) e das
 * respostas (comentários unificados).
 * <p>
 * Dados vivos do autor (role, joinedAt) vêm do Postgres em UMA busca em lote
 * por página ({@code findAllById}); {@code postCount} é resolvido uma vez por
 * autor distinto. {@code myVote} do usuário autenticado é resolvido em lote
 * pelos votos do tópico — sem N+1. Categoria é resolvida via
 * {@link DomainLabelService} (type {@code forum_category}).
 */
@Component
@RequiredArgsConstructor
public class ForumMapper {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final String LABEL_TYPE_FORUM_CATEGORY = "forum_category";

    private final DomainLabelService domainLabels;
    private final UserRepositoryPort userRepository;
    private final GetAuthorPostCountUseCase getAuthorPostCountUseCase;
    private final ForumTopicVoteRepositoryPort topicVoteRepository;

    public Page<ForumTopicSummaryResponse> toSummaryPage(Page<ForumTopic> page, UUID viewerId) {
        Map<String, User> users = fetchUsers(page.map(ForumTopic::getAuthorId).getContent());
        Map<String, VoteValue> myVotes = fetchMyVotes(page.map(ForumTopic::getId).getContent(), viewerId);
        Map<String, ForumAuthorResponse> authorCache = new HashMap<>();

        return page.map(topic -> toSummary(
                topic,
                author(topic.getAuthorId(), topic.getAuthorName(), topic.getAuthorPhoto(), users, authorCache),
                myVotes.get(topic.getId())));
    }

    public ForumTopicResponse toResponse(ForumTopicDetail detail, UUID viewerId) {
        ForumTopic topic = detail.topic();
        List<Comment> replies = detail.replies();

        Map<String, User> users = fetchUsers(Stream.concat(
                        Stream.of(topic.getAuthorId()),
                        replies.stream().map(Comment::getUserId))
                .toList());
        Map<String, VoteValue> myVotes = fetchMyVotes(List.of(topic.getId()), viewerId);
        Map<String, ForumAuthorResponse> authorCache = new HashMap<>();

        List<ForumReplyResponse> replyResponses = replies.stream()
                .map(reply -> new ForumReplyResponse(
                        reply.getId(),
                        author(reply.getUserId(), reply.getUserName(), reply.getUserPhoto(), users, authorCache),
                        reply.getTextContent(),
                        formatDateTime(reply.getCreatedAt()),
                        formatDateTime(reply.getUpdatedAt()),
                        reply.getUpvotes(),
                        reply.getDownvotes(),
                        reply.isEdited(),
                        reply.isHighlighted()
                ))
                .toList();

        ForumAuthorResponse author =
                author(topic.getAuthorId(), topic.getAuthorName(), topic.getAuthorPhoto(), users, authorCache);

        return new ForumTopicResponse(
                topic.getId(),
                topic.getTitle(),
                topic.getContent(),
                author,
                categoryLabel(topic),
                topic.getTags(),
                formatDateTime(topic.getCreatedAt()),
                formatDateTime(topic.getUpdatedAt()),
                formatDateTime(topic.getLastActivityAt()),
                topic.getViewCount(),
                topic.getReplyCount(),
                topic.getUpvotes(),
                topic.getDownvotes(),
                voteName(myVotes.get(topic.getId())),
                topic.isPinned(),
                topic.isLocked(),
                topic.isSolved(),
                topic.isEdited(),
                replyResponses
        );
    }

    private ForumTopicSummaryResponse toSummary(ForumTopic topic, ForumAuthorResponse author, VoteValue myVote) {
        return new ForumTopicSummaryResponse(
                topic.getId(),
                topic.getTitle(),
                topic.getContent(),
                author,
                categoryLabel(topic),
                topic.getTags(),
                formatDateTime(topic.getCreatedAt()),
                formatDateTime(topic.getUpdatedAt()),
                formatDateTime(topic.getLastActivityAt()),
                topic.getViewCount(),
                topic.getReplyCount(),
                topic.getUpvotes(),
                topic.getDownvotes(),
                voteName(myVote),
                topic.isPinned(),
                topic.isLocked(),
                topic.isSolved(),
                topic.isEdited()
        );
    }

    /**
     * Resolve o autor combinando snapshot (sempre presente no doc) com os dados
     * vivos do Postgres quando o usuário ainda existe; conta deletada cai no
     * snapshot com role "member".
     */
    private ForumAuthorResponse author(String authorId, String snapshotName, String snapshotPhoto,
                                       Map<String, User> users, Map<String, ForumAuthorResponse> cache) {
        return cache.computeIfAbsent(authorId, id -> {
            User user = users.get(id);
            int postCount = (int) getAuthorPostCountUseCase.execute(id);

            if (user == null) {
                return new ForumAuthorResponse(id, snapshotName, snapshotPhoto, "member", postCount, null);
            }

            String role = switch (user.getRole()) {
                case ADMIN -> "admin";
                case MODERATOR -> "moderator";
                default -> "member";
            };

            return new ForumAuthorResponse(
                    id,
                    user.getName(),
                    user.getPhotoUrl(),
                    role,
                    postCount,
                    user.getCreatedAt() != null ? user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : null
            );
        });
    }

    private Map<String, User> fetchUsers(Collection<String> authorIds) {
        List<UUID> ids = authorIds.stream()
                .distinct()
                .map(ForumMapper::parseUuid)
                .filter(Objects::nonNull)
                .toList();

        if (ids.isEmpty()) {
            return Map.of();
        }

        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(u -> u.getId().toString(), Function.identity()));
    }

    private Map<String, VoteValue> fetchMyVotes(Collection<String> topicIds, UUID viewerId) {
        if (viewerId == null || topicIds.isEmpty()) {
            return Map.of();
        }

        return topicVoteRepository.findByTopicIdInAndUserId(topicIds, viewerId.toString()).stream()
                .collect(Collectors.toMap(ForumTopicVote::getTopicId, ForumTopicVote::getValue, (a, b) -> a));
    }

    private String categoryLabel(ForumTopic topic) {
        if (topic.getCategory() == null) {
            return null;
        }

        return domainLabels.resolveLabel(
                LABEL_TYPE_FORUM_CATEGORY,
                topic.getCategory().name(),
                topic.getCategory().getDisplayName());
    }

    private static String voteName(VoteValue vote) {
        return vote != null ? vote.name().toLowerCase() : null;
    }

    /** IDs de seed/legado podem não ser UUID — autor cai no snapshot. */
    private static UUID parseUuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;

        return dateTime.format(FMT);
    }
}
