package com.toonlira.presentation.publisher.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request admin para atualização de editora. Campos nulos ignorados.
 */
public record UpdatePublisherRequest(
        @Size(max = 255, message = "{validation.publisher.name.size}")
        String name,
        @Size(max = 10, message = "{validation.publisher.country.size}")
        String country,
        @Size(max = 512, message = "{validation.publisher.website.size}")
        @Pattern(regexp = "(?i)^https?://[^\\s]+$", message = "{validation.publisher.website.url}")
        String website,
        @Size(max = 512) String logoUrl,
        String description,
        @Valid @Size(max = 20) List<PublisherAliasRequest> aliases
) {
}
