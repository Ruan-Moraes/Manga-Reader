package com.mangareader.presentation.errorlog.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload para criação de um registro de erro.
 */
public record CreateErrorLogRequest(
        @NotBlank(message = "A mensagem de erro é obrigatória.")
        String message,

        String stackTrace,

        @NotBlank(message = "A origem do erro é obrigatória.")
        String source,

        String url,

        String userAgent,

        String userId
) {}
