package com.mangareader.application.manga.usecase.admin;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.manga.service.GenreValidator;
import com.mangareader.application.manga.service.TitleAssociationWriter;
import com.mangareader.application.manga.service.TitleStoreAssociationWriter;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.domain.i18n.LocalizedString;

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
                         List<TitleAuthorAssignment> authors, List<Long> publisherIds, List<TitleStoreAssignment> stores) {
        genreValidator.validate(genres);

        Title title = Title.builder()
                .name(toLocalized(name))
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

        Title saved = titleRepository.save(title);

        if (authors != null) associationWriter.replaceAuthors(saved.getId(), authors);
        if (publisherIds != null) associationWriter.replacePublishers(saved.getId(), publisherIds);
        if (stores != null) storeAssociationWriter.replace(saved.getId(), stores);

        return saved;
    }

    private static LocalizedString toLocalized(Map<String, String> map) {
        return (map == null || map.isEmpty()) ? LocalizedString.empty() : LocalizedString.of(map);
    }
}
