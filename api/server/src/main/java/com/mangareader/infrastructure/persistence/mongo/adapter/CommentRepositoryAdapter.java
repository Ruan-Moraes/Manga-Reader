package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
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
    public List<Comment> findByTargetTypeAndTargetIdAndParentCommentIdIsNull(CommentTarget targetType, String targetId) {
        return repository.findByTargetTypeAndTargetIdAndParentCommentIdIsNull(targetType, targetId);
    }

    @Override
    public List<Comment> findByTargetTypeAndTargetId(CommentTarget targetType, String targetId) {
        return repository.findByTargetTypeAndTargetId(targetType, targetId);
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
    public Page<Comment> findByTargetTypeAndTargetId(CommentTarget targetType, String targetId, Pageable pageable) {
        return repository.findByTargetTypeAndTargetId(targetType, targetId, pageable);
    }

    @Override
    public Page<Comment> findByTargetTypeAndTargetIdAndLanguageIn(
            CommentTarget targetType, String targetId, Collection<String> languages, Pageable pageable) {
        return repository.findByTargetTypeAndTargetIdAndLanguageIn(targetType, targetId, languages, pageable);
    }

    @Override
    public Page<Comment> findByUserId(String userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable);
    }

    @Override
    public long countByUserId(String userId) {
        return repository.countByUserId(userId);
    }

    @Override
    public long countByTargetTypeAndTargetId(CommentTarget targetType, String targetId) {
        return repository.countByTargetTypeAndTargetId(targetType, targetId);
    }

    @Override
    public void deleteByTargetTypeAndTargetId(CommentTarget targetType, String targetId) {
        repository.deleteByTargetTypeAndTargetId(targetType, targetId);
    }
}
