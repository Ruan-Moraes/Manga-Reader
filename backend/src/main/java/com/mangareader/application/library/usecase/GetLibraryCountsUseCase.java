package com.mangareader.application.library.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.domain.library.valueobject.ReadingListType;

import lombok.RequiredArgsConstructor;

/**
 * Retorna as contagens de mangás agrupadas por tipo de lista de leitura.
 */
@Service
@RequiredArgsConstructor
public class GetLibraryCountsUseCase {

    private final LibraryRepositoryPort libraryRepository;

    public record LibraryCounts(long lendo, long queroLer, long concluido, long total) {}

    public LibraryCounts execute(UUID userId) {
        long lendo = libraryRepository.countByUserIdAndList(userId, ReadingListType.LENDO);
        long queroLer = libraryRepository.countByUserIdAndList(userId, ReadingListType.QUERO_LER);
        long concluido = libraryRepository.countByUserIdAndList(userId, ReadingListType.CONCLUIDO);

        return new LibraryCounts(lendo, queroLer, concluido, lendo + queroLer + concluido);
    }
}
