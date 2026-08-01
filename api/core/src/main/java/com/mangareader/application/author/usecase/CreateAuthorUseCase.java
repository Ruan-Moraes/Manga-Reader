package com.mangareader.application.author.usecase;

import java.util.HashSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.domain.author.entity.Author;
import com.mangareader.domain.author.entity.AuthorAlias;
import com.mangareader.domain.author.valueobject.AuthorAliasType;
import com.mangareader.shared.domain.SearchText;
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
            String nationality,
            String imageUrl,
            List<AliasInput> aliases
    ) {
        public CreateAuthorInput(String name, String bio, String nationality) {
            this(name, bio, nationality, null, null);
        }
    }

    public record AliasInput(String name, AuthorAliasType type) {
    }

    @Transactional
    public Author execute(CreateAuthorInput input) {
        String slug = Slugs.unique(input.name(), authorRepository::existsBySlug);

        Author author = Author.builder()
                .name(input.name().trim())
                .slug(slug)
                .bio(input.bio())
                .nationality(input.nationality())
                .imageUrl(input.imageUrl())
                .build();
        replaceAliases(author, input.aliases());

        return authorRepository.save(author);
    }

    static void replaceAliases(Author author, List<AliasInput> inputs) {
        author.getAliases().clear();
        if (inputs == null) return;

        var normalizedNames = new HashSet<String>();
        for (var input : inputs) {
            var name = input.name() == null ? "" : input.name().trim();
            var normalized = SearchText.normalize(name);
            if (name.isBlank() || input.type() == null || !normalizedNames.add(normalized)) {
                throw new IllegalArgumentException("Author aliases must be non-empty and unique");
            }
            author.getAliases().add(AuthorAlias.builder()
                    .author(author)
                    .name(name)
                    .type(input.type())
                    .build());
        }
    }
}
