package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.mangareader.application.comment.port.CommentVoteRepositoryPort;
import com.mangareader.domain.comment.entity.CommentVote;
import com.mangareader.infrastructure.persistence.mongo.repository.CommentVoteMongoRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CommentVoteRepositoryAdapter implements CommentVoteRepositoryPort {
    private final CommentVoteMongoRepository repository;

    @Override
    public Optional<CommentVote> findByCommentIdAndUserId(String commentId, String userId) {
        return repository.findByCommentIdAndUserId(commentId, userId);
    }

    @Override
    public List<CommentVote> findByCommentIdInAndUserId(List<String> commentIds, String userId) {
        return repository.findByCommentIdInAndUserId(commentIds, userId);
    }

    @Override
    public CommentVote save(CommentVote vote) {
        return repository.save(vote);
    }

    @Override
    public void delete(CommentVote vote) {
        repository.delete(vote);
    }
}
