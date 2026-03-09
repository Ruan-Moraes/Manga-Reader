package com.mangareader.application.library.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Altera a lista de leitura de um mangá salvo (ex: "Lendo" → "Concluído").
 */
@Service
@RequiredArgsConstructor
public class ChangeReadingListUseCase {

    private final LibraryRepositoryPort libraryRepository;

    public record ChangeListInput(UUID userId, String titleId, ReadingListType newList) {}

    public SavedManga execute(ChangeListInput input) {
        SavedManga saved = libraryRepository.findByUserIdAndTitleId(input.userId(), input.titleId())
                .orElseThrow(() -> new ResourceNotFoundException("SavedManga", "titleId", input.titleId()));

        saved.setList(input.newList());
        return libraryRepository.save(saved);
    }
}
