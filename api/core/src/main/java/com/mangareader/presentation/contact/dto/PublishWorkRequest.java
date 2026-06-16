package com.mangareader.presentation.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para solicitação de publicação de trabalho.
 */
public record PublishWorkRequest(
        @NotBlank(message = "{validation.name.required}")
        @Size(min = 2, max = 100, message = "{validation.name.size}")
        String name,

        @NotBlank(message = "{validation.email.required}")
        @Email(message = "{validation.contact.emailFormat}")
        String email,

        @NotBlank(message = "{validation.contact.workType.required}")
        String workType,

        @NotBlank(message = "{validation.contact.workTitle.required}")
        @Size(min = 2, max = 200, message = "{validation.contact.workTitle.size}")
        String workTitle,

        @NotBlank(message = "{validation.contact.synopsis.required}")
        @Size(min = 10, max = 2000, message = "{validation.contact.synopsis.size}")
        String synopsis,

        String portfolioLink,

        @NotBlank(message = "{validation.contact.message.required}")
        @Size(min = 10, max = 5000, message = "{validation.contact.message.size}")
        String message
) {
}
