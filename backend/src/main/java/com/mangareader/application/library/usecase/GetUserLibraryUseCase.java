package com.mangareader.application.library.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todos os mangás salvos na biblioteca do usuário.
 */
@Service
@RequiredArgsConstructor
public class GetUserLibraryUseCase {

    private final LibraryRepositoryPort libraryRepository;

    public Page<SavedManga> execute(UUID userId, Pageable pageable) {
        return libraryRepository.findByUserId(userId, pageable);
    }
}
