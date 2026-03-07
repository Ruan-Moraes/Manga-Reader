package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.comment.entity.Comment;

/**
 * Spring Data MongoDB repository para comentários.
 */
public interface CommentMongoRepository extends MongoRepository<Comment, String> {

    List<Comment> findByTitleId(String titleId);

    List<Comment> findByTitleIdAndParentCommentIdIsNull(String titleId);

    List<Comment> findByParentCommentId(String parentCommentId);

    Page<Comment> findByTitleId(String titleId, Pageable pageable);
}
