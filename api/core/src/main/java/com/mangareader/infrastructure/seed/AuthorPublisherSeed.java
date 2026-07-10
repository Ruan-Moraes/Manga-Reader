package com.mangareader.infrastructure.seed;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.author.entity.Author;
import com.mangareader.domain.author.entity.TitleAuthor;
import com.mangareader.domain.author.valueobject.AuthorRole;
import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.domain.publisher.entity.TitlePublisher;
import com.mangareader.infrastructure.persistence.postgres.repository.AuthorJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.PublisherJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.TitleAuthorJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.TitlePublisherJpaRepository;
import com.mangareader.shared.domain.Slugs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Popula {@code authors}/{@code publishers} (PostgreSQL) e relaciona com os
 * títulos de demonstração criados por {@link TitleSeed} (Mongo, IDs "1".."10"),
 * via {@code title_authors}/{@code title_publishers}.
 * <p>
 * Espelha, em dados de dev, a mesma relação que {@code AuthorPublisherBackfillRunner}
 * (profile {@code migration}) reconstrói a partir dos campos legados de
 * {@code Title.author/artist/publisher} — autor e artista dedicados por título, com
 * papel ({@link AuthorRole#AUTHOR}/{@link AuthorRole#ARTIST}), e editora dedicada.
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class AuthorPublisherSeed implements EntitySeeder {
    private final AuthorJpaRepository authorRepository;
    private final PublisherJpaRepository publisherRepository;
    private final TitleAuthorJpaRepository titleAuthorRepository;
    private final TitlePublisherJpaRepository titlePublisherRepository;

    /** Roda depois do {@link TitleSeed} (order 2) — precisa dos titles já persistidos. */
    @Override
    public int getOrder() {
        return 3;
    }

    private record TitleCredit(String titleId, String authorName, String artistName, String publisherName) {
    }

    private static final List<TitleCredit> CREDITS = List.of(
            new TitleCredit("1", "Takeshi Yamamoto", "Takeshi Yamamoto", "Panini"),
            new TitleCredit("2", "Park Ji-Won", "Lee Soo-Hyun", "NewPOP"),
            new TitleCredit("3", "Yuki Aoi", "Yuki Aoi", "JBC"),
            new TitleCredit("4", "Hiroshi Tanaka", "Hiroshi Tanaka", "Panini"),
            new TitleCredit("5", "Kim Dae-Sung", "Kim Dae-Sung", "NewPOP"),
            new TitleCredit("6", "Chen Wei", "Liu Xing", "Panini"),
            new TitleCredit("7", "Sakura Miyazaki", "Sakura Miyazaki", "JBC"),
            new TitleCredit("8", "Park Min-Ho", "Park Min-Ho", "NewPOP"),
            new TitleCredit("9", "Kazuki Morimoto", "Kazuki Morimoto", "Panini"),
            new TitleCredit("10", "Zhang Liang", "Zhang Liang", "JBC"));

    /** Caches por LOWER(name) para deduplicar autores/editoras repetidos entre títulos. */
    private final Map<String, Author> authorCache = new HashMap<>();
    private final Map<String, Publisher> publisherCache = new HashMap<>();

    @Override
    public void seed() {
        if (authorRepository.count() > 0 || publisherRepository.count() > 0) {
            log.info("Autores/editoras já existem — seed de autores/editoras ignorado.");

            return;
        }

        int links = 0;
        for (TitleCredit credit : CREDITS) {
            linkAuthor(credit.titleId(), credit.authorName(), AuthorRole.AUTHOR);
            linkAuthor(credit.titleId(), credit.artistName(), AuthorRole.ARTIST);
            linkPublisher(credit.titleId(), credit.publisherName());
            links += 3;
        }

        log.info("✓ {} autores, {} editoras e {} relações título↔autor/editora criadas.",
                authorRepository.count(), publisherRepository.count(), links);
    }

    private void linkAuthor(String titleId, String name, AuthorRole role) {
        Author author = resolveAuthor(name);

        titleAuthorRepository.save(TitleAuthor.builder()
                .titleId(titleId)
                .author(author)
                .role(role)
                .build());
    }

    private void linkPublisher(String titleId, String name) {
        Publisher publisher = resolvePublisher(name);

        titlePublisherRepository.save(TitlePublisher.builder()
                .titleId(titleId)
                .publisher(publisher)
                .build());
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
}
