package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.infrastructure.persistence.mongo.repository.CommentMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Comment ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class CommentRepositoryAdapter implements CommentRepositoryPort {

    private final CommentMongoRepository repository;

    @Override
    public List<Comment> findByTitleId(String titleId) {
        return repository.findByTitleId(titleId);
    }

    @Override
    public List<Comment> findByTitleIdAndParentCommentIdIsNull(String titleId) {
        return repository.findByTitleIdAndParentCommentIdIsNull(titleId);
    }

    @Override
    public List<Comment> findByParentCommentId(String parentCommentId) {
        return repository.findByParentCommentId(parentCommentId);
    }

    @Override
    public Optional<Comment> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public Comment save(Comment comment) {
        return repository.save(comment);
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    public Page<Comment> findByTitleId(String titleId, Pageable pageable) {
        return repository.findByTitleId(titleId, pageable);
    }
}
