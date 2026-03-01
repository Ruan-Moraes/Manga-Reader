package com.mangareader.application.comment.port;

import java.util.List;
import java.util.Optional;

import com.mangareader.domain.comment.entity.Comment;

/**
 * Port de saída — acesso a dados de Comments (MongoDB).
 */
public interface CommentRepositoryPort {

    List<Comment> findByTitleId(String titleId);

    List<Comment> findByTitleIdAndParentCommentIdIsNull(String titleId);

    List<Comment> findByParentCommentId(String parentCommentId);

    Optional<Comment> findById(String id);

    Comment save(Comment comment);

    void deleteById(String id);
}
