package com.mangareader.application.publisher.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.domain.publisher.entity.Publisher;

import lombok.RequiredArgsConstructor;

/**
 * Lista editoras paginadas; filtra por nome quando {@code query} é informado.
 */
@Service
@RequiredArgsConstructor
public class ListPublishersUseCase {
    private final PublisherRepositoryPort publisherRepository;

    @Transactional(readOnly = true)
    public Page<Publisher> execute(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return publisherRepository.findAll(pageable);
        }
        return publisherRepository.searchByName(query, pageable);
    }
}
