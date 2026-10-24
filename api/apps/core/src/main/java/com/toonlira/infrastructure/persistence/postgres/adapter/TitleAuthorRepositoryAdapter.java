package com.toonlira.infrastructure.persistence.postgres.adapter;

import java.util.Collection;
import java.util.List;

import org.springframework.stereotype.Component;

import com.toonlira.application.author.port.TitleAuthorRepositoryPort;
import com.toonlira.domain.author.entity.TitleAuthor;
import com.toonlira.infrastructure.persistence.postgres.repository.TitleAuthorJpaRepository;
import com.toonlira.application.manga.port.TitleReferenceMatch;
import com.toonlira.domain.manga.valueobject.TitleSearchMatchType;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de TitleAuthor ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class TitleAuthorRepositoryAdapter implements TitleAuthorRepositoryPort {
    private final TitleAuthorJpaRepository repository;

    @Override
    public List<TitleAuthor> findByTitleId(String titleId) {
        return repository.findByTitleId(titleId);
    }

    @Override
    public List<TitleAuthor> findByTitleIdIn(Collection<String> titleIds) {
        if (titleIds == null || titleIds.isEmpty()) {
            return List.of();
        }
        return repository.findByTitleIdIn(titleIds);
    }

    @Override
    public List<String> findTitleIdsByAuthorId(Long authorId) {
        return repository.findTitleIdsByAuthorId(authorId);
    }

    @Override
    public List<TitleAuthor> findByAuthorIdIn(Collection<Long> authorIds) {
        return authorIds == null || authorIds.isEmpty()
                ? List.of()
                : repository.findByAuthorIdIn(authorIds);
    }

    @Override
    public List<TitleReferenceMatch> searchTitleReferences(String query) {
        if (query == null || query.isBlank()) return List.of();

        return repository.searchTitleReferences(query).stream()
                .map(match -> new TitleReferenceMatch(
                        match.getTitleId(),
                        isArtistRole(match.getRole()) ? TitleSearchMatchType.ARTIST : TitleSearchMatchType.AUTHOR,
                        match.getMatchedText()))
                .toList();
    }

    private static boolean isArtistRole(String role) {
        return "ARTIST".equals(role) || "COLORIST".equals(role);
    }

    @Override
    public TitleAuthor save(TitleAuthor titleAuthor) {
        return repository.save(titleAuthor);
    }

    @Override
    public void deleteByTitleId(String titleId) {
        repository.deleteByTitleId(titleId);
    }
}
