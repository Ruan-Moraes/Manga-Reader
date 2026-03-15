package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.infrastructure.persistence.mongo.repository.RatingMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Rating ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class RatingRepositoryAdapter implements RatingRepositoryPort {
    private final RatingMongoRepository repository;

    @Override
    public List<MangaRating> findByTitleId(String titleId) {
        return repository.findByTitleId(titleId);
    }

    @Override
    public Optional<MangaRating> findByTitleIdAndUserId(String titleId, String userId) {
        return repository.findByTitleIdAndUserId(titleId, userId);
    }

    @Override
    public Optional<MangaRating> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public MangaRating save(MangaRating rating) {
        return repository.save(rating);
    }

    @Override
    public List<MangaRating> findByUserId(String userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    public long countByTitleId(String titleId) {
        return repository.countByTitleId(titleId);
    }

    @Override
    public Page<MangaRating> findByTitleId(String titleId, Pageable pageable) {
        return repository.findByTitleId(titleId, pageable);
    }

    @Override
    public Page<MangaRating> findByUserId(String userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable);
    }

    @Override
    public long countByUserId(String userId) {
        return repository.countByUserId(userId);
    }
}
