package com.mangareader.application.publisher.usecase;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.application.publisher.usecase.CreatePublisherUseCase.AliasInput;
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
            String website,
            String logoUrl,
            String description,
            List<AliasInput> aliases
    ) {
        public UpdatePublisherInput(
                Long publisherId, String name, String country, String website) {
            this(publisherId, name, country, website, null, null, null);
        }
    }

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
        if (input.logoUrl() != null) {
            publisher.setLogoUrl(input.logoUrl());
        }
        if (input.description() != null) {
            publisher.setDescription(input.description());
        }
        if (input.aliases() != null) {
            CreatePublisherUseCase.replaceAliases(publisher, input.aliases());
        }

        return publisherRepository.save(publisher);
    }
}
