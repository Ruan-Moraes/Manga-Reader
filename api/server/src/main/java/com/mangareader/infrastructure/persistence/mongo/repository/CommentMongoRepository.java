package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;

/**
 * Spring Data MongoDB repository para comentários unificados.
 */
public interface CommentMongoRepository extends MongoRepository<Comment, String> {
    List<Comment> findByTargetTypeAndTargetIdAndParentCommentIdIsNull(CommentTarget targetType, String targetId);

    List<Comment> findByTargetTypeAndTargetId(CommentTarget targetType, String targetId);

    List<Comment> findByParentCommentId(String parentCommentId);

    Page<Comment> findByTargetTypeAndTargetId(CommentTarget targetType, String targetId, Pageable pageable);

    Page<Comment> findByTargetTypeAndTargetIdAndLanguageIn(
            CommentTarget targetType, String targetId, Collection<String> languages, Pageable pageable);

    Page<Comment> findByUserId(String userId, Pageable pageable);

    long countByUserId(String userId);

    long countByTargetTypeAndTargetId(CommentTarget targetType, String targetId);
}
