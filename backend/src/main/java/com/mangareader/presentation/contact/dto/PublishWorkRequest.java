package com.mangareader.presentation.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para solicitação de publicação de trabalho.
 */
public record PublishWorkRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
        String name,

        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Formato de email inválido")
        String email,

        @NotBlank(message = "Tipo de trabalho é obrigatório")
        String workType,

        @NotBlank(message = "Título do trabalho é obrigatório")
        @Size(min = 2, max = 200, message = "Título deve ter entre 2 e 200 caracteres")
        String workTitle,

        @NotBlank(message = "Sinopse é obrigatória")
        @Size(min = 10, max = 2000, message = "Sinopse deve ter entre 10 e 2000 caracteres")
        String synopsis,

        String portfolioLink,

        @NotBlank(message = "Mensagem é obrigatória")
        @Size(min = 10, max = 5000, message = "Mensagem deve ter entre 10 e 5000 caracteres")
        String message
) {
}
