package com.mangareader.application.comment.port;

import java.util.List;
import java.util.Optional;

import com.mangareader.domain.comment.entity.CommentVote;

/**
 * Port de saída — votos em comentários (MongoDB). Modelo de voto único.
 */
public interface CommentVoteRepositoryPort {
    Optional<CommentVote> findByCommentIdAndUserId(String commentId, String userId);

    List<CommentVote> findByCommentIdInAndUserId(List<String> commentIds, String userId);

    CommentVote save(CommentVote vote);

    void delete(CommentVote vote);
}
