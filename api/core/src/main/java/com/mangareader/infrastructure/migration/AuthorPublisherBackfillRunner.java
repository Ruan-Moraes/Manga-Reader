package com.mangareader.infrastructure.migration;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.domain.author.entity.Author;
import com.mangareader.domain.author.entity.TitleAuthor;
import com.mangareader.domain.author.valueobject.AuthorRole;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.domain.publisher.entity.TitlePublisher;
import com.mangareader.infrastructure.persistence.mongo.repository.TitleMongoRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.AuthorJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.PublisherJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.TitleAuthorJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.TitlePublisherJpaRepository;
import com.mangareader.shared.domain.Slugs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Backfill one-shot: extrai autor/artista/editora dos documentos {@code titles}
 * (MongoDB, campos string desnormalizados) e popula as tabelas relacionais
 * {@code authors}, {@code publishers} e suas junções no PostgreSQL.
 * <p>
 * Ativo apenas no profile {@code migration}. Idempotente: junções já existentes
 * (mesmo titleId + autor/editora + role) não são duplicadas, e autores/editoras
 * são deduplicados por {@code LOWER(name)}.
 * <ul>
 *   <li>campo {@code author} → role {@link AuthorRole#AUTHOR}</li>
 *   <li>campo {@code artist} → role {@link AuthorRole#ARTIST}</li>
 * </ul>
 */
@Slf4j
@Component
@Profile("migration")
@RequiredArgsConstructor
public class AuthorPublisherBackfillRunner implements ApplicationRunner {

    private static final int BATCH_SIZE = 500;

    private final TitleMongoRepository titleRepository;
    private final AuthorJpaRepository authorRepository;
    private final PublisherJpaRepository publisherRepository;
    private final TitleAuthorJpaRepository titleAuthorRepository;
    private final TitlePublisherJpaRepository titlePublisherRepository;

    /** Caches por LOWER(name) para deduplicar dentro da execução. */
    private final Map<String, Author> authorCache = new HashMap<>();
    private final Map<String, Publisher> publisherCache = new HashMap<>();

    @Override
    public void run(ApplicationArguments args) {
        log.info("AuthorPublisherBackfill: iniciando varredura de titles (lotes de {})", BATCH_SIZE);

        int page = 0;
        long titlesSeen = 0;
        Page<Title> slice;

        do {
            Pageable pageable = PageRequest.of(page, BATCH_SIZE);
            slice = titleRepository.findAll(pageable);

            for (Title title : slice.getContent()) {
                processTitle(title);
                titlesSeen++;
            }

            page++;
        } while (slice.hasNext());

        log.info("AuthorPublisherBackfill: concluído. {} titles processados, {} autores, {} editoras.",
                titlesSeen, authorRepository.count(), publisherRepository.count());
    }

    private void processTitle(Title title) {
        String titleId = title.getId();
        if (titleId == null || titleId.isBlank()) {
            return;
        }

        linkAuthor(titleId, title.getAuthor(), AuthorRole.AUTHOR);
        linkAuthor(titleId, title.getArtist(), AuthorRole.ARTIST);
        linkPublisher(titleId, title.getPublisher());
    }

    private void linkAuthor(String titleId, String rawName, AuthorRole role) {
        String name = normalize(rawName);
        if (name == null) {
            return;
        }

        Author author = resolveAuthor(name);

        if (!titleAuthorRepository.existsByTitleIdAndAuthorIdAndRole(titleId, author.getId(), role)) {
            titleAuthorRepository.save(TitleAuthor.builder()
                    .titleId(titleId)
                    .author(author)
                    .role(role)
                    .build());
        }
    }

    private void linkPublisher(String titleId, String rawName) {
        String name = normalize(rawName);
        if (name == null) {
            return;
        }

        Publisher publisher = resolvePublisher(name);

        if (!titlePublisherRepository.existsByTitleIdAndPublisherId(titleId, publisher.getId())) {
            titlePublisherRepository.save(TitlePublisher.builder()
                    .titleId(titleId)
                    .publisher(publisher)
                    .build());
        }
    }

    private Author resolveAuthor(String name) {
        return authorCache.computeIfAbsent(name.toLowerCase(), key -> {
            String slug = Slugs.unique(name, authorRepository::existsBySlug);
            return authorRepository.save(Author.builder()
                    .name(name)
                    .slug(slug)
                    .build());
        });
    }

    private Publisher resolvePublisher(String name) {
        return publisherCache.computeIfAbsent(name.toLowerCase(), key -> {
            String slug = Slugs.unique(name, publisherRepository::existsBySlug);
            return publisherRepository.save(Publisher.builder()
                    .name(name)
                    .slug(slug)
                    .build());
        });
    }

    /** Trim + colapsa espaços duplicados; retorna {@code null} para nulo/vazio. */
    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = value.trim().replaceAll("\\s+", " ");
        return cleaned.isEmpty() ? null : cleaned;
    }
}
