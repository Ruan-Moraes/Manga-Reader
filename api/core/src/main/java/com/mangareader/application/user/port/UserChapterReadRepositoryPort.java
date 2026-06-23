package com.mangareader.application.user.port;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

import com.mangareader.domain.user.entity.UserChapterRead;

/**
 * Port de saída — acesso a dados de UserChapterRead (MongoDB).
 */
public interface UserChapterReadRepositoryPort {
    Optional<UserChapterRead> findByUserIdAndTitleIdAndChapterNumber(String userId, String titleId, String chapterNumber);

    UserChapterRead save(UserChapterRead read);

    /**
     * Conta, em lote, os capítulos lidos pelo usuário em cada um dos títulos
     * informados. Retorna apenas títulos com pelo menos uma leitura (uma
     * agregação, sem N+1). Chave = titleId, valor = nº de capítulos lidos.
     */
    Map<String, Long> countByUserIdAndTitleIdIn(String userId, Collection<String> titleIds);

    void deleteAllByUserId(String userId);

    void deleteByTitleId(String titleId);
}
