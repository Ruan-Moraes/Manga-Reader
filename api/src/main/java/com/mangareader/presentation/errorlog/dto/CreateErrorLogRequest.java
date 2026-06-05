package com.mangareader.presentation.errorlog.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Payload para criação de um registro de erro.
 */
public record CreateErrorLogRequest(
        @NotBlank(message = "{validation.errorLog.message.required}")
        String message,

        String stackTrace,

        @NotBlank(message = "{validation.errorLog.source.required}")
        String source,

        String url,

        String userAgent,

        String userId
) {}
