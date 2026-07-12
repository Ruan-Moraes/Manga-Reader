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
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza um título existente (admin). Mapas multilíngues; nulos mantêm valor.
 * <p>
 * {@code authors}/{@code publisherIds} são opcionais: quando não-nulos, substituem
 * (replace) as junções relacionais do título; nulos preservam as existentes.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class UpdateTitleUseCase {
    private final TitleRepositoryPort titleRepository;
    private final GenreValidator genreValidator;
    private final TitleAssociationWriter associationWriter;
    private final TitleStoreAssociationWriter storeAssociationWriter;

    public Title execute(String titleId, Map<String, String> name, String type, String cover,
                         Map<String, String> synopsis,
                         List<String> genres, String status,
                         String author, String artist, String publisher, Boolean adult) {
        return execute(titleId, name, type, cover, synopsis, genres, status, author,
                artist, publisher, adult, null, null, null);
    }

    /** Compatibilidade com consumidores que ainda não enviam vínculos de loja. */
    public Title execute(String titleId, Map<String, String> name, String type, String cover,
                         Map<String, String> synopsis, List<String> genres, String status,
                         String author, String artist, String publisher, Boolean adult,
                         List<TitleAuthorAssignment> authors, List<Long> publisherIds) {
        return execute(titleId, name, type, cover, synopsis, genres, status, author, artist, publisher,
                adult, authors, publisherIds, null);
    }

    public Title execute(String titleId, Map<String, String> name, String type, String cover,
                         Map<String, String> synopsis,
                         List<String> genres, String status,
                         String author, String artist, String publisher, Boolean adult,
                         List<TitleAuthorAssignment> authors, List<Long> publisherIds, List<TitleStoreAssignment> stores) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", titleId));

        if (genres != null) genreValidator.validate(genres);

        if (name != null) title.setName(LocalizedString.of(name));
        if (type != null) title.setType(type);
        if (cover != null) title.setCover(cover);
        if (synopsis != null) title.setSynopsis(LocalizedString.of(synopsis));
        if (genres != null) title.setGenres(genres);
        if (status != null) title.setStatus(status);
        if (author != null) title.setAuthor(author);
        if (artist != null) title.setArtist(artist);
        if (publisher != null) title.setPublisher(publisher);
        if (adult != null) title.setAdult(adult);

        Title saved = titleRepository.save(title);

        if (authors != null) associationWriter.replaceAuthors(titleId, authors);
        if (publisherIds != null) associationWriter.replacePublishers(titleId, publisherIds);
        if (stores != null) storeAssociationWriter.replace(titleId, stores);

        return saved;
    }
}
