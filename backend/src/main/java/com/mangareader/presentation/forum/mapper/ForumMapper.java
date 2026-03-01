package com.mangareader.presentation.forum.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

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

    public static ForumTopicResponse toResponse(ForumTopic topic) {
        if (topic == null) return null;

        return new ForumTopicResponse(
                topic.getId().toString(),
                topic.getTitle(),
                topic.getContent(),
                mapAuthor(topic.getAuthor()),
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
                mapReplies(topic.getReplies())
        );
    }

    public static List<ForumTopicResponse> toResponseList(List<ForumTopic> topics) {
        if (topics == null) return Collections.emptyList();
        return topics.stream().map(ForumMapper::toResponse).toList();
    }

    private static ForumAuthorResponse mapAuthor(User user) {
        if (user == null) return null;

        String role = switch (user.getRole()) {
            case ADMIN -> "admin";
            case MODERATOR -> "moderator";
            default -> "member";
        };

        return new ForumAuthorResponse(
                user.getId().toString(),
                user.getName(),
                user.getPhotoUrl(),
                role,
                0, // postCount — pode ser calculado futuramente
                user.getCreatedAt() != null ? user.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : null
        );
    }

    private static List<ForumReplyResponse> mapReplies(List<ForumReply> replies) {
        if (replies == null) return Collections.emptyList();
        return replies.stream()
                .map(r -> new ForumReplyResponse(
                        r.getId().toString(),
                        mapAuthor(r.getAuthor()),
                        r.getContent(),
                        formatDateTime(r.getCreatedAt()),
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
