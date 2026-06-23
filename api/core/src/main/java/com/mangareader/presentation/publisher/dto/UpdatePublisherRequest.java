package com.mangareader.presentation.publisher.dto;

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
        String website
) {
}
