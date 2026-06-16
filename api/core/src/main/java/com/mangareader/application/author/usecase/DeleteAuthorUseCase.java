package com.mangareader.application.author.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui um autor. As junções em {@code title_authors} caem por {@code ON DELETE CASCADE}.
 */
@Service
@RequiredArgsConstructor
public class DeleteAuthorUseCase {
    private final AuthorRepositoryPort authorRepository;

    @Transactional
    public void execute(Long id) {
        if (authorRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Author", "id", id);
        }
        authorRepository.deleteById(id);
    }
}
