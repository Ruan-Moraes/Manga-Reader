package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.infrastructure.persistence.postgres.repository.LibraryJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Library ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class LibraryRepositoryAdapter implements LibraryRepositoryPort {
    private final LibraryJpaRepository repository;

    @Override
    public List<SavedManga> findByUserId(UUID userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public List<SavedManga> findByUserIdAndList(UUID userId, ReadingListType list) {
        return repository.findByUserIdAndList(userId, list);
    }

    @Override
    public Optional<SavedManga> findByUserIdAndTitleId(UUID userId, String titleId) {
        return repository.findByUserIdAndTitleId(userId, titleId);
    }

    @Override
    public SavedManga save(SavedManga savedManga) {
        return repository.save(savedManga);
    }

    @Override
    public void deleteByUserIdAndTitleId(UUID userId, String titleId) {
        repository.deleteByUserIdAndTitleId(userId, titleId);
    }

    @Override
    public Page<SavedManga> findByUserId(UUID userId, Pageable pageable) {
        return repository.findByUserId(userId, pageable);
    }

    @Override
    public Page<SavedManga> findByUserIdAndList(UUID userId, ReadingListType list, Pageable pageable) {
        return repository.findByUserIdAndList(userId, list, pageable);
    }

    @Override
    public long countByUserIdAndList(UUID userId, ReadingListType list) {
        return repository.countByUserIdAndList(userId, list);
    }
}
