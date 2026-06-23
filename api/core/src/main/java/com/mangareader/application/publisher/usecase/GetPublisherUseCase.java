package com.mangareader.application.publisher.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna uma editora pelo ID.
 */
@Service
@RequiredArgsConstructor
public class GetPublisherUseCase {
    private final PublisherRepositoryPort publisherRepository;

    @Transactional(readOnly = true)
    public Publisher execute(Long id) {
        return publisherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Publisher", "id", id));
    }
}
