package com.mangareader.application.author.port;

import java.util.Collection;
import java.util.List;

import com.mangareader.domain.author.entity.TitleAuthor;

/**
 * Port de saída — junção título ↔ autor (PostgreSQL).
 */
public interface TitleAuthorRepositoryPort {
    List<TitleAuthor> findByTitleId(String titleId);

    /** Batch fetch para evitar N+1 ao montar respostas de listagem. */
    List<TitleAuthor> findByTitleIdIn(Collection<String> titleIds);

    /** Busca invertida: IDs de títulos (Mongo) associados a um autor. */
    List<String> findTitleIdsByAuthorId(Long authorId);

    TitleAuthor save(TitleAuthor titleAuthor);

    void deleteByTitleId(String titleId);
}
