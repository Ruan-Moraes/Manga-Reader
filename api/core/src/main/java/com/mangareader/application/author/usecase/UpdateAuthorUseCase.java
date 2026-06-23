package com.mangareader.application.author.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.domain.author.entity.Author;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza um autor. O slug não é alterado (identidade estável).
 */
@Service
@RequiredArgsConstructor
public class UpdateAuthorUseCase {
    private final AuthorRepositoryPort authorRepository;

    public record UpdateAuthorInput(
            Long authorId,
            String name,
            String bio,
            String nationality
    ) {}

    @Transactional
    public Author execute(UpdateAuthorInput input) {
        Author author = authorRepository.findById(input.authorId())
                .orElseThrow(() -> new ResourceNotFoundException("Author", "id", input.authorId()));

        if (input.name() != null && !input.name().isBlank()) {
            author.setName(input.name().trim());
        }
        if (input.bio() != null) {
            author.setBio(input.bio());
        }
        if (input.nationality() != null) {
            author.setNationality(input.nationality());
        }

        return authorRepository.save(author);
    }
}
