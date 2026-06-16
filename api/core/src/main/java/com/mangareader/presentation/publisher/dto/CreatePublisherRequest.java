package com.mangareader.presentation.publisher.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para criação de editora (admin).
 */
public record CreatePublisherRequest(
        @NotBlank(message = "{validation.publisher.name.required}")
        @Size(max = 255, message = "{validation.publisher.name.size}")
        String name,
        @Size(max = 10, message = "{validation.publisher.country.size}")
        String country,
        @Size(max = 512, message = "{validation.publisher.website.size}")
        String website
) {
}
