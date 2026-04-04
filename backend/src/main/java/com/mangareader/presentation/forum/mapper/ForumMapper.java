package com.mangareader.presentation.forum.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

import com.mangareader.domain.forum.entity.ForumReply;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.presentation.forum.dto.ForumAuthorResponse;
import com.mangareader.presentation.forum.dto.ForumReplyResponse;
import com.mangareader.presentation.forum.dto.ForumTopicResponse;

/**
 * Mapper para converter entidades de Forum em DTOs de resposta.
 */
public final class ForumMapper {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private ForumMapper() {}

    public static ForumTopicResponse toResponse(ForumTopic topic, Function<UUID, Long> postCountFn) {
        if (topic == null) return null;

        return new ForumTopicResponse(
                topic.getId().toString(),
                topic.getTitle(),
                topic.getContent(),
                mapAuthor(topic.getAuthor(), postCountFn),
                topic.getCategory() != null ? topic.getCategory().getDisplayName() : null,
                topic.getTags(),
                formatDateTime(topic.getCreatedAt()),
                formatDateTime(topic.getLastActivityAt()),
                topic.getViewCount(),
                topic.getReplyCount(),
                topic.getLikeCount(),
                topic.isPinned(),
                topic.isLocked(),
                topic.isSolved(),
                mapReplies(topic.getReplies(), postCountFn)
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
                        r.getLikes(),
                        r.isEdited(),
                        r.isBestAnswer()
                ))
                .toList();
    }

    // Todo: Extrair para um utilitário de formatação de datas
    private static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;

        return dateTime.format(FMT);
    }
}
