package com.mangareader.application.author.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.domain.author.entity.Author;
import com.mangareader.shared.domain.Slugs;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo autor. O slug é derivado do nome, com sufixo numérico em colisão.
 */
@Service
@RequiredArgsConstructor
public class CreateAuthorUseCase {
    private final AuthorRepositoryPort authorRepository;

    public record CreateAuthorInput(
            String name,
            String bio,
            String nationality
    ) {}

    @Transactional
    public Author execute(CreateAuthorInput input) {
        String slug = Slugs.unique(input.name(), authorRepository::existsBySlug);

        Author author = Author.builder()
                .name(input.name().trim())
                .slug(slug)
                .bio(input.bio())
                .nationality(input.nationality())
                .build();

        return authorRepository.save(author);
    }
}
