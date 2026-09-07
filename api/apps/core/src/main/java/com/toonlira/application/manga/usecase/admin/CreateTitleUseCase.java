package com.toonlira.application.manga.usecase.admin;

import java.util.List;
import java.util.Map;
import java.util.HashSet;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.manga.service.GenreValidator;
import com.toonlira.application.manga.service.TitleAssociationWriter;
import com.toonlira.application.manga.service.TitleStoreAssociationWriter;
import com.toonlira.application.shared.port.CacheInvalidationPort;
import com.toonlira.domain.manga.entity.Title;
import com.toonlira.domain.manga.valueobject.TitleAlias;
import com.toonlira.shared.domain.SearchText;
import com.toonlira.shared.constant.CacheNames;
import com.toonlira.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo título (admin).
 * <p>
 * Os campos texto {@code author}/{@code artist}/{@code publisher} continuam sendo
 * gravados; em paralelo, {@code authors}/{@code publisherIds} (opcionais) populam
 * as junções relacionais via {@link TitleAssociationWriter}.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CreateTitleUseCase {
    private final TitleRepositoryPort titleRepository;
    private final GenreValidator genreValidator;
    private final TitleAssociationWriter associationWriter;
    private final TitleStoreAssociationWriter storeAssociationWriter;
    private final CacheInvalidationPort cacheInvalidation;

    public Title execute(Map<String, String> name, String type, String cover,
                         Map<String, String> synopsis,
                         List<String> genres, String status, String author,
                         String artist, String publisher, boolean adult) {
        return execute(name, type, cover, synopsis, genres, status, author, artist,
                publisher, adult, null, null, null);
    }

    /** Compatibilidade com consumidores que ainda não enviam vínculos de loja. */
    public Title execute(Map<String, String> name, String type, String cover,
                         Map<String, String> synopsis, List<String> genres, String status, String author,
                         String artist, String publisher, boolean adult, List<TitleAuthorAssignment> authors,
                         List<Long> publisherIds) {
        return execute(name, type, cover, synopsis, genres, status, author, artist, publisher, adult,
                authors, publisherIds, null);
    }

    public Title execute(Map<String, String> name, String type, String cover,
                         Map<String, String> synopsis,
                         List<String> genres, String status, String author,
                         String artist, String publisher, boolean adult,
                         List<TitleAlias> aliases,
                         List<TitleAuthorAssignment> authors, List<Long> publisherIds,
                         List<TitleStoreAssignment> stores) {
        validateAliases(aliases);
        var title = buildAndSave(name, type, cover, synopsis, genres, status, author,
                artist, publisher, adult, aliases);
        if (authors != null || publisherIds != null) {
            associationWriter.replace(title.getId(), authors, publisherIds);
        }
        if (stores != null) storeAssociationWriter.replace(title.getId(), stores);
        cacheInvalidation.evictAfterCommit(CacheNames.TITLE, title.getId());
        cacheInvalidation.clearAfterCommit(CacheNames.PUBLIC_STATS);
        return title;
    }

    public Title execute(Map<String, String> name, String type, String cover,
                         Map<String, String> synopsis,
                         List<String> genres, String status, String author,
                         String artist, String publisher, boolean adult,
                         List<TitleAuthorAssignment> authors, List<Long> publisherIds, List<TitleStoreAssignment> stores) {
        return execute(name, type, cover, synopsis, genres, status, author, artist,
                publisher, adult, List.of(), authors, publisherIds, stores);
    }

    private Title buildAndSave(Map<String, String> name, String type, String cover,
                         Map<String, String> synopsis,
                         List<String> genres, String status, String author,
                         String artist, String publisher, boolean adult,
                         List<TitleAlias> aliases) {
        genreValidator.validate(genres);

        Title title = Title.builder()
                .name(toLocalized(name))
                .aliases(aliases != null ? aliases : List.of())
                .type(type)
                .cover(cover)
                .synopsis(toLocalized(synopsis))
                .genres(genres != null ? genres : List.of())
                .status(status)
                .author(author)
                .artist(artist)
                .publisher(publisher)
                .adult(adult)
                .build();

        return titleRepository.save(title);
    }

    private static LocalizedString toLocalized(Map<String, String> map) {
        return (map == null || map.isEmpty()) ? LocalizedString.empty() : LocalizedString.of(map);
    }

    static void validateAliases(List<TitleAlias> aliases) {
        if (aliases == null) return;
        if (aliases.size() > 20) throw new IllegalArgumentException("At most 20 title aliases are allowed");
        var normalized = new HashSet<String>();
        for (var alias : aliases) {
            if (alias == null || alias.getType() == null || alias.getName() == null
                    || alias.getName().isBlank()
                    || !normalized.add(SearchText.normalize(alias.getName()))) {
                throw new IllegalArgumentException("Title aliases must be non-empty and unique");
            }
            alias.setName(alias.getName().trim());
        }
    }
}
