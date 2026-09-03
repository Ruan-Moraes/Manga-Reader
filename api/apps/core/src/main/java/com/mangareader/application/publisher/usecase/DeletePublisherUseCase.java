package com.mangareader.application.publisher.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui uma editora. As junções em {@code title_publishers} caem por {@code ON DELETE CASCADE}.
 */
@Service
@RequiredArgsConstructor
public class DeletePublisherUseCase {
    private final PublisherRepositoryPort publisherRepository;

    @Transactional
    public void execute(Long id) {
        if (publisherRepository.findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Publisher", "id", id);
        }
        publisherRepository.deleteById(id);
    }
}
