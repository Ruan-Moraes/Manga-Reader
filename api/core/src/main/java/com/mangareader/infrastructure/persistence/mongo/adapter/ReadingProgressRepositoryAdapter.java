package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Optional;

import org.springframework.stereotype.Component;

import com.mangareader.application.user.port.ReadingProgressRepositoryPort;
import com.mangareader.domain.user.entity.ReadingProgress;
import com.mangareader.infrastructure.persistence.mongo.repository.ReadingProgressMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de ReadingProgress ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class ReadingProgressRepositoryAdapter implements ReadingProgressRepositoryPort {
    private final ReadingProgressMongoRepository repository;

    @Override
    public Optional<ReadingProgress> findByUserIdAndTitleIdAndChapterNumber(String userId, String titleId, String chapterNumber) {
        return repository.findByUserIdAndTitleIdAndChapterNumber(userId, titleId, chapterNumber);
    }

    @Override
    public ReadingProgress save(ReadingProgress progress) {
        return repository.save(progress);
    }

    @Override
    public Optional<ReadingProgress> findLatestByUserIdAndTitleId(String userId, String titleId) {
        return repository.findTopByUserIdAndTitleIdOrderByUpdatedAtDesc(userId, titleId);
    }

    @Override
    public void deleteAllByUserId(String userId) {
        repository.deleteAllByUserId(userId);
    }

    @Override
    public void deleteByTitleId(String titleId) {
        repository.deleteByTitleId(titleId);
    }
}
