package com.mangareader.application.publisher.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza uma editora. O slug não é alterado (identidade estável).
 */
@Service
@RequiredArgsConstructor
public class UpdatePublisherUseCase {
    private final PublisherRepositoryPort publisherRepository;

    public record UpdatePublisherInput(
            Long publisherId,
            String name,
            String country,
            String website
    ) {}

    @Transactional
    public Publisher execute(UpdatePublisherInput input) {
        Publisher publisher = publisherRepository.findById(input.publisherId())
                .orElseThrow(() -> new ResourceNotFoundException("Publisher", "id", input.publisherId()));

        if (input.name() != null && !input.name().isBlank()) {
            publisher.setName(input.name().trim());
        }
        if (input.country() != null) {
            publisher.setCountry(input.country());
        }
        if (input.website() != null) {
            publisher.setWebsite(input.website());
        }

        return publisherRepository.save(publisher);
    }
}
