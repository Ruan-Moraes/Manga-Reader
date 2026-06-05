package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.mangareader.application.comment.port.CommentReactionRepositoryPort;
import com.mangareader.domain.comment.entity.CommentReaction;
import com.mangareader.infrastructure.persistence.mongo.repository.CommentReactionMongoRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CommentReactionRepositoryAdapter implements CommentReactionRepositoryPort {
    private final CommentReactionMongoRepository repository;

    @Override
    public Optional<CommentReaction> findByCommentIdAndUserId(String commentId, String userId) {
        return repository.findByCommentIdAndUserId(commentId, userId);
    }

    @Override
    public List<CommentReaction> findByCommentIdInAndUserId(List<String> commentIds, String userId) {
        return repository.findByCommentIdInAndUserId(commentIds, userId);
    }

    @Override
    public CommentReaction save(CommentReaction reaction) {
        return repository.save(reaction);
    }

    @Override
    public void delete(CommentReaction reaction) {
        repository.delete(reaction);
    }
}
