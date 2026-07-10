package com.mangareader.application.user.usecase;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.user.port.ReadingProgressRepositoryPort;
import com.mangareader.domain.user.entity.ReadingProgress;

import lombok.RequiredArgsConstructor;

/**
 * Busca o progresso de leitura mais recente de um título (entre todos os
 * capítulos), para restaurar "de onde o usuário parou". Sem guarda de
 * privacidade: o endpoint é {@code /me/...}, acessível apenas pelo próprio
 * usuário autenticado.
 */
@Service
@RequiredArgsConstructor
public class GetLatestReadingProgressUseCase {
    private final ReadingProgressRepositoryPort readingProgressRepository;

    public Optional<ReadingProgress> execute(UUID userId, String titleId) {
        return readingProgressRepository.findLatestByUserIdAndTitleId(userId.toString(), titleId);
    }
}
