package com.mangareader.application.user.usecase;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.ReadingProgressRepositoryPort;
import com.mangareader.domain.user.entity.ReadingProgress;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Salva a posição de leitura (página atual / conclusão) de um capítulo.
 * <p>
 * Ao contrário de {@link RecordChapterReadUseCase}, NÃO respeita
 * {@code viewHistoryVisibility}: progresso é estado pessoal ("onde parei"),
 * não histórico visível a terceiros — decisão intencional, não esquecimento.
 * <p>
 * Quando a conclusão transiciona de {@code false} para {@code true} pela
 * primeira vez, delega a {@link RecordChapterReadUseCase} (composição de use
 * cases) para registrar o evento "capítulo lido", reaproveitando a
 * idempotência e a guarda de privacidade já implementadas lá — o progresso é
 * salvo ANTES dessa chamada para que qualquer falha não deixe estado
 * parcial (mesma transação Mongo, propagação REQUIRED).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class SaveReadingProgressUseCase {
    private final ReadingProgressRepositoryPort readingProgressRepository;
    private final TitleRepositoryPort titleRepository;
    private final RecordChapterReadUseCase recordChapterReadUseCase;

    public record SaveProgressInput(
            UUID userId,
            String titleId,
            String chapterNumber,
            int currentPage,
            int totalPages,
            boolean completed) {}

    public ReadingProgress execute(SaveProgressInput input) {
        if (input.currentPage() < 1 || input.totalPages() < 1 || input.currentPage() > input.totalPages()) {
            throw new BusinessRuleException("Reading pages must form a valid positive range", 422);
        }
        if (input.completed() && input.currentPage() != input.totalPages()) {
            throw new BusinessRuleException("Completed progress must point to the last page", 422);
        }
        if (titleRepository.findById(input.titleId()).isEmpty()) {
            throw new ResourceNotFoundException("Title", "id", input.titleId());
        }

        String userIdStr = input.userId().toString();

        Optional<ReadingProgress> existing = readingProgressRepository
                .findByUserIdAndTitleIdAndChapterNumber(userIdStr, input.titleId(), input.chapterNumber());
        boolean wasCompleted = existing.map(ReadingProgress::isCompleted).orElse(false);

        ReadingProgress toSave = existing.orElseGet(() -> ReadingProgress.builder()
                .userId(userIdStr)
                .titleId(input.titleId())
                .chapterNumber(input.chapterNumber())
                .build());
        toSave.setCurrentPage(input.currentPage());
        toSave.setTotalPages(input.totalPages());
        toSave.setCompleted(input.completed());

        ReadingProgress saved = readingProgressRepository.save(toSave);

        if (!wasCompleted && input.completed()) {
            recordChapterReadUseCase.execute(input.userId(), input.titleId(), input.chapterNumber());
        }

        return saved;
    }
}
