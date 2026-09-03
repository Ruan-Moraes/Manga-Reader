package com.mangareader.presentation.publisher.mapper;

import com.mangareader.domain.publisher.entity.Publisher;
import com.mangareader.presentation.publisher.dto.PublisherResponse;
import com.mangareader.presentation.publisher.dto.PublisherAliasResponse;

/**
 * Mapper estático Publisher → PublisherResponse.
 */
public final class PublisherMapper {

    private PublisherMapper() {
    }

    public static PublisherResponse toResponse(Publisher publisher) {
        if (publisher == null) return null;

        return new PublisherResponse(
                publisher.getId(),
                publisher.getName(),
                publisher.getSlug(),
                publisher.getCountry(),
                publisher.getWebsite(),
                publisher.getLogoUrl(),
                publisher.getDescription(),
                publisher.getAliases().stream()
                        .map(alias -> new PublisherAliasResponse(
                                alias.getId(), alias.getName(), alias.getType()))
                        .toList(),
                publisher.getCreatedAt(),
                publisher.getUpdatedAt()
        );
    }
}
