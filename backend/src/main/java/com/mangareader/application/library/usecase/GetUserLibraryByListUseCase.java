package com.mangareader.application.library.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;

import lombok.RequiredArgsConstructor;

/**
 * Retorna mangás salvos filtrados por tipo de lista de leitura, com paginação.
 */
@Service
@RequiredArgsConstructor
public class GetUserLibraryByListUseCase {

    private final LibraryRepositoryPort libraryRepository;

    public Page<SavedManga> execute(UUID userId, ReadingListType list, Pageable pageable) {
        return libraryRepository.findByUserIdAndList(userId, list, pageable);
    }
}
