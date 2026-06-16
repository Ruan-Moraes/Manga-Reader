package com.mangareader.application.publisher.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.shared.domain.Slugs;

import lombok.RequiredArgsConstructor;

/**
 * Cria uma nova editora. O slug é derivado do nome, com sufixo numérico em colisão.
 */
@Service
@RequiredArgsConstructor
public class CreatePublisherUseCase {
    private final PublisherRepositoryPort publisherRepository;

    public record CreatePublisherInput(
            String name,
            String country,
            String website
    ) {}

    @Transactional
    public Publisher execute(CreatePublisherInput input) {
        String slug = Slugs.unique(input.name(), publisherRepository::existsBySlug);

        Publisher publisher = Publisher.builder()
                .name(input.name().trim())
                .slug(slug)
                .country(input.country())
                .website(input.website())
                .build();

        return publisherRepository.save(publisher);
    }
}
