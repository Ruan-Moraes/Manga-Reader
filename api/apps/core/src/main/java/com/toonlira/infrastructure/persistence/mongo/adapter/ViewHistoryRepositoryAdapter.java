package com.toonlira.infrastructure.persistence.mongo.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.toonlira.application.user.port.ViewHistoryRepositoryPort;
import com.toonlira.domain.user.entity.ViewHistory;
import com.toonlira.infrastructure.persistence.mongo.repository.ViewHistoryMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de ViewHistory ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class ViewHistoryRepositoryAdapter implements ViewHistoryRepositoryPort {
    private final ViewHistoryMongoRepository repository;

    @Override
    public Page<ViewHistory> findByUserIdOrderByViewedAtDesc(String userId, Pageable pageable) {
        return repository.findByUserIdOrderByViewedAtDesc(userId, pageable);
    }

    @Override
    public Optional<ViewHistory> findByUserIdAndTitleId(String userId, String titleId) {
        return repository.findByUserIdAndTitleId(userId, titleId);
    }

    @Override
    public List<ViewHistory> findAllByUserId(String userId) {
        return repository.findAllByUserIdOrderByViewedAtDesc(userId);
    }

    @Override
    public ViewHistory save(ViewHistory viewHistory) {
        return repository.save(viewHistory);
    }

    @Override
    public void deleteAllByUserId(String userId) {
        repository.deleteAllByUserId(userId);
    }
}
