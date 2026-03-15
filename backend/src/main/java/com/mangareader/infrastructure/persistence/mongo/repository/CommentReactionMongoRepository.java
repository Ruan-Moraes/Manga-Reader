package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.comment.entity.CommentReaction;

public interface CommentReactionMongoRepository extends MongoRepository<CommentReaction, String> {

    Optional<CommentReaction> findByCommentIdAndUserId(String commentId, String userId);

    List<CommentReaction> findByCommentIdInAndUserId(List<String> commentIds, String userId);
}
