package com.mangareader.application.library.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.DuplicateResourceException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Salva um título na biblioteca do usuário.
 */
@Service
@RequiredArgsConstructor
public class SaveToLibraryUseCase {

    private final LibraryRepositoryPort libraryRepository;
    private final UserRepositoryPort userRepository;
    private final TitleRepositoryPort titleRepository;

    public record SaveToLibraryInput(UUID userId, String titleId, ReadingListType list) {}

    public SavedManga execute(SaveToLibraryInput input) {
        // Verifica se já existe
        libraryRepository.findByUserIdAndTitleId(input.userId(), input.titleId())
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("SavedManga", "titleId", input.titleId());
                });

        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        Title title = titleRepository.findById(input.titleId())
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", input.titleId()));

        SavedManga saved = SavedManga.builder()
                .user(user)
                .titleId(input.titleId())
                .name(title.getName())
                .cover(title.getCover())
                .type(title.getType())
                .list(input.list())
                .build();

        return libraryRepository.save(saved);
    }
}
