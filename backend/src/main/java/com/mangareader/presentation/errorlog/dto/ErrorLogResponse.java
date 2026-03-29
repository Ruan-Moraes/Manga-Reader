package com.mangareader.presentation.errorlog.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Resposta resumida de um registro de erro.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorLogResponse(
        String id,
        String message,
        String source,
        LocalDateTime createdAt
) {}
