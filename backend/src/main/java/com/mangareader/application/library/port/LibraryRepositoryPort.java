package com.mangareader.application.library.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;

/**
 * Port de saída — acesso a dados de Library / SavedManga (PostgreSQL).
 */
public interface LibraryRepositoryPort {

    List<SavedManga> findByUserId(UUID userId);

    List<SavedManga> findByUserIdAndList(UUID userId, ReadingListType list);

    Optional<SavedManga> findByUserIdAndTitleId(UUID userId, String titleId);

    SavedManga save(SavedManga savedManga);

    void deleteByUserIdAndTitleId(UUID userId, String titleId);
}
