package com.mangareader.application.library.usecase;

import java.util.List;
import java.util.UUID;

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

    public List<SavedManga> execute(UUID userId) {
        return libraryRepository.findByUserId(userId);
    }
}
