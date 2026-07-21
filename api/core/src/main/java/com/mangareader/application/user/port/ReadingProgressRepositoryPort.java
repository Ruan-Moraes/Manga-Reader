package com.mangareader.application.user.port;

import java.util.List;
import java.util.Optional;

import com.mangareader.domain.user.entity.ReadingProgress;

/**
 * Port de saída — acesso a dados de ReadingProgress (MongoDB).
 */
public interface ReadingProgressRepositoryPort {
    Optional<ReadingProgress> findByUserIdAndTitleIdAndChapterNumber(String userId, String titleId, String chapterNumber);

    ReadingProgress save(ReadingProgress progress);

    /**
     * Progresso mais recente entre todos os capítulos do título, para
     * restaurar "de onde o usuário parou".
     */
    Optional<ReadingProgress> findLatestByUserIdAndTitleId(String userId, String titleId);

    List<ReadingProgress> findAllByUserId(String userId);

    void deleteAllByUserId(String userId);

    void deleteByTitleId(String titleId);
}
