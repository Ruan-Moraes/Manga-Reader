package com.mangareader.presentation.forum.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.stereotype.Component;

import com.mangareader.application.label.service.DomainLabelService;
import com.mangareader.domain.forum.entity.ForumReply;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.user.entity.User;
import com.mangareader.presentation.forum.dto.ForumAuthorResponse;
import com.mangareader.presentation.forum.dto.ForumReplyResponse;
import com.mangareader.presentation.forum.dto.ForumTopicResponse;
import com.mangareader.presentation.forum.dto.ForumTopicSummaryResponse;

import lombok.RequiredArgsConstructor;

/**
 * Mapper ForumTopic/ForumReply → DTOs públicos. Categoria resolvida via
 * {@link DomainLabelService} (type {@code forum_category}); fallback para
 * {@code getDisplayName()} se não houver entrada no banco.
 */
@Component
@RequiredArgsConstructor
public class ForumMapper {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final String LABEL_TYPE_FORUM_CATEGORY = "forum_category";

    private final DomainLabelService domainLabels;

    public ForumTopicResponse toResponse(ForumTopic topic, Function<UUID, Long> postCountFn) {
        if (topic == null) return null;

        String category = topic.getCategory() != null
                ? domainLabels.resolveLabel(
                        LABEL_TYPE_FORUM_CATEGORY,
                        topic.getCategory().name(),
                        topic.getCategory().getDisplayName())
                : null;

        return new ForumTopicResponse(
                topic.getId().toString(),
                topic.getTitle(),
                topic.getContent(),
                mapAuthor(topic.getAuthor(), postCountFn),
                category,
                topic.getTags(),
                formatDateTime(topic.getCreatedAt()),
                formatDateTime(topic.getUpdatedAt()),
                formatDateTime(topic.getLastActivityAt()),
                topic.getViewCount(),
                topic.getReplyCount(),
                topic.getLikeCount(),
                topic.isPinned(),
                topic.isLocked(),
                topic.isSolved(),
                topic.isEdited(),
                mapReplies(topic.getReplies(), postCountFn)
        );
    }

    /**
     * Variante para LISTAGEM — sem replies (evita N+1 aninhado). Usa o
     * escalar {@code replyCount} já desnormalizado em {@link ForumTopic}.
     */
    public ForumTopicSummaryResponse toSummary(ForumTopic topic, Function<UUID, Long> postCountFn) {
        if (topic == null) return null;

        String category = topic.getCategory() != null
                ? domainLabels.resolveLabel(
                        LABEL_TYPE_FORUM_CATEGORY,
                        topic.getCategory().name(),
                        topic.getCategory().getDisplayName())
                : null;

        return new ForumTopicSummaryResponse(
                topic.getId().toString(),
                topic.getTitle(),
                topic.getContent(),
                mapAuthor(topic.getAuthor(), postCountFn),
                category,
                topic.getTags(),
                formatDateTime(topic.getCreatedAt()),
                formatDateTime(topic.getUpdatedAt()),
                formatDateTime(topic.getLastActivityAt()),
                topic.getViewCount(),
                topic.getReplyCount(),
                topic.getLikeCount(),
                topic.isPinned(),
                topic.isLocked(),
                topic.isSolved(),
                topic.isEdited()
        );
    }

    private static ForumAuthorResponse mapAuthor(User user, Function<UUID, Long> postCountFn) {
        if (user == null) return null;

        String role = switch (user.getRole()) {
            case ADMIN -> "admin";
            case MODERATOR -> "moderator";
            default -> "member";
        };

        int postCount = postCountFn.apply(user.getId()).intValue();

        return new ForumAuthorResponse(
                user.getId().toString(),
                user.getName(),
                user.getPhotoUrl(),
                role,
                postCount,
                user.getCreatedAt() != null ? user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : null
        );
    }

    private static List<ForumReplyResponse> mapReplies(List<ForumReply> replies, Function<UUID, Long> postCountFn) {
        if (replies == null) return Collections.emptyList();

        return replies.stream()
                .map(r -> new ForumReplyResponse(
                        r.getId().toString(),
                        mapAuthor(r.getAuthor(), postCountFn),
                        r.getContent(),
                        formatDateTime(r.getCreatedAt()),
                        formatDateTime(r.getUpdatedAt()),
                        r.getLikes(),
                        r.isEdited(),
                        r.isBestAnswer()
                ))
                .toList();
    }

    private static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;

        return dateTime.format(FMT);
    }
}
