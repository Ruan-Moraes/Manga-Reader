package com.toonlira.application.author.port;

import java.util.Collection;
import java.util.List;

import com.toonlira.domain.author.entity.TitleAuthor;
import com.toonlira.application.manga.port.TitleReferenceMatch;

/**
 * Port de saída — junção título ↔ autor (PostgreSQL).
 */
public interface TitleAuthorRepositoryPort {
    List<TitleAuthor> findByTitleId(String titleId);

    /** Batch fetch para evitar N+1 ao montar respostas de listagem. */
    List<TitleAuthor> findByTitleIdIn(Collection<String> titleIds);

    /** Busca invertida: IDs de títulos (Mongo) associados a um autor. */
    List<String> findTitleIdsByAuthorId(Long authorId);

    List<TitleAuthor> findByAuthorIdIn(Collection<Long> authorIds);

    List<TitleReferenceMatch> searchTitleReferences(String query);

    TitleAuthor save(TitleAuthor titleAuthor);

    void deleteByTitleId(String titleId);
}
