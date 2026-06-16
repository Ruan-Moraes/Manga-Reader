package com.mangareader.application.manga.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.application.author.port.TitleAuthorRepositoryPort;
import com.mangareader.application.manga.usecase.admin.TitleAuthorAssignment;
import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.application.publisher.port.TitlePublisherRepositoryPort;
import com.mangareader.domain.author.entity.Author;
import com.mangareader.domain.author.entity.TitleAuthor;
import com.mangareader.domain.author.valueobject.AuthorRole;
import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.domain.publisher.entity.TitlePublisher;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Escreve as junções relacionais ({@code title_authors}, {@code title_publishers})
 * de um título no PostgreSQL.
 * <p>
 * Semântica de <i>replace</i>: limpa as linhas existentes do título e regrava a
 * partir da lista informada (lista vazia ⇒ remove todas). Entrada {@code null}
 * deve ser tratada pelo chamador (não invocar).
 * <p>
 * <b>Nota:</b> chamado de dentro de use cases anotados com
 * {@code @Transactional("mongoTransactionManager")}; estas escritas JPA correm no
 * gerenciador de transações JPA (primário), <b>não</b> são atômicas com a escrita
 * Mongo do título. Ver DT em {@code docs/tech-debt.md}.
 */
@Service
@RequiredArgsConstructor
public class TitleAssociationWriter {
    private final AuthorRepositoryPort authorRepository;
    private final PublisherRepositoryPort publisherRepository;
    private final TitleAuthorRepositoryPort titleAuthorRepository;
    private final TitlePublisherRepositoryPort titlePublisherRepository;

    public void replaceAuthors(String titleId, List<TitleAuthorAssignment> assignments) {
        titleAuthorRepository.deleteByTitleId(titleId);

        if (assignments == null) return;

        Set<String> seen = new HashSet<>();
        for (TitleAuthorAssignment assignment : assignments) {
            if (assignment == null || assignment.authorId() == null) continue;

            AuthorRole role = assignment.role() != null ? assignment.role() : AuthorRole.AUTHOR;
            if (!seen.add(assignment.authorId() + ":" + role)) continue;

            Author author = authorRepository.findById(assignment.authorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Author", "id", assignment.authorId()));

            titleAuthorRepository.save(TitleAuthor.builder()
                    .titleId(titleId).author(author).role(role).build());
        }
    }

    public void replacePublishers(String titleId, List<Long> publisherIds) {
        titlePublisherRepository.deleteByTitleId(titleId);

        if (publisherIds == null) return;

        Set<Long> seen = new HashSet<>();
        for (Long publisherId : publisherIds) {
            if (publisherId == null || !seen.add(publisherId)) continue;

            Publisher publisher = publisherRepository.findById(publisherId)
                    .orElseThrow(() -> new ResourceNotFoundException("Publisher", "id", publisherId));

            titlePublisherRepository.save(TitlePublisher.builder()
                    .titleId(titleId).publisher(publisher).build());
        }
    }

    public void clear(String titleId) {
        titleAuthorRepository.deleteByTitleId(titleId);
        titlePublisherRepository.deleteByTitleId(titleId);
    }
}
