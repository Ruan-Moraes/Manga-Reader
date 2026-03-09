package com.mangareader.application.library.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.library.port.LibraryRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Remove um título da biblioteca do usuário.
 */
@Service
@RequiredArgsConstructor
public class RemoveFromLibraryUseCase {

    private final LibraryRepositoryPort libraryRepository;

    @Transactional
    public void execute(UUID userId, String titleId) {
        libraryRepository.deleteByUserIdAndTitleId(userId, titleId);
    }
}
