package com.mangareader.application.comment.port;

import java.util.List;
import java.util.Optional;

import com.mangareader.domain.comment.entity.CommentReaction;

public interface CommentReactionRepositoryPort {
    Optional<CommentReaction> findByCommentIdAndUserId(String commentId, String userId);

    List<CommentReaction> findByCommentIdInAndUserId(List<String> commentIds, String userId);

    CommentReaction save(CommentReaction reaction);

    void delete(CommentReaction reaction);
}
