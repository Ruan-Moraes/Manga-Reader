package com.mangareader.presentation.comment.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.presentation.comment.dto.CommentResponse;

/**
 * Mapper para converter entidade Comment em DTO de resposta.
 */
public final class CommentMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private CommentMapper() {}

    public static CommentResponse toResponse(Comment comment) {
        if (comment == null) return null;

        return new CommentResponse(
                comment.getId(),
                comment.getTitleId(),
                comment.getParentCommentId(),
                comment.getUserId(),
                comment.getUserName(),
                comment.getUserPhoto(),
                comment.isHighlighted(),
                comment.isWasEdited(),
                formatDate(comment.getCreatedAt()),
                comment.getTextContent(),
                comment.getImageContent(),
                String.valueOf(comment.getLikeCount()),
                String.valueOf(comment.getDislikeCount())
        );
    }

    public static List<CommentResponse> toResponseList(List<Comment> comments) {
        if (comments == null) return Collections.emptyList();
        return comments.stream().map(CommentMapper::toResponse).toList();
    }

    private static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(FMT);
    }
}
