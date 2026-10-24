package com.toonlira.infrastructure.persistence.mongo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.toonlira.domain.comment.entity.CommentVote;

public interface CommentVoteMongoRepository extends MongoRepository<CommentVote, String> {
    Optional<CommentVote> findByCommentIdAndUserId(String commentId, String userId);

    List<CommentVote> findByCommentIdInAndUserId(List<String> commentIds, String userId);

    void deleteByCommentId(String commentId);

    void deleteByCommentIdIn(List<String> commentIds);
}
