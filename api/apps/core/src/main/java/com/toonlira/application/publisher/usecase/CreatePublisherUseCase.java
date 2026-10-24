package com.toonlira.application.publisher.usecase;

import java.util.HashSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.publisher.port.PublisherRepositoryPort;
import com.toonlira.domain.publisher.entity.Publisher;
import com.toonlira.domain.publisher.entity.PublisherAlias;
import com.toonlira.domain.publisher.valueobject.PublisherAliasType;
import com.toonlira.shared.domain.SearchText;
import com.toonlira.shared.domain.Slugs;

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
            String website,
            String logoUrl,
            String description,
            List<AliasInput> aliases
    ) {
        public CreatePublisherInput(String name, String country, String website) {
            this(name, country, website, null, null, null);
        }
    }

    public record AliasInput(String name, PublisherAliasType type) {
    }

    @Transactional
    public Publisher execute(CreatePublisherInput input) {
        String slug = Slugs.unique(input.name(), publisherRepository::existsBySlug);

        Publisher publisher = Publisher.builder()
                .name(input.name().trim())
                .slug(slug)
                .country(input.country())
                .website(input.website())
                .logoUrl(input.logoUrl())
                .description(input.description())
                .build();
        replaceAliases(publisher, input.aliases());

        return publisherRepository.save(publisher);
    }

    static void replaceAliases(Publisher publisher, List<AliasInput> inputs) {
        publisher.getAliases().clear();
        if (inputs == null) return;

        var normalizedNames = new HashSet<String>();
        for (var input : inputs) {
            var name = input.name() == null ? "" : input.name().trim();
            var normalized = SearchText.normalize(name);
            if (name.isBlank() || input.type() == null || !normalizedNames.add(normalized)) {
                throw new IllegalArgumentException("Publisher aliases must be non-empty and unique");
            }
            publisher.getAliases().add(PublisherAlias.builder()
                    .publisher(publisher)
                    .name(name)
                    .type(input.type())
                    .build());
        }
    }
}
