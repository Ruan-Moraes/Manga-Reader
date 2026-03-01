package com.mangareader.shared.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Resposta de erro de validação com detalhes por campo.
 * <p>
 * Retornada quando {@code @Valid} falha ou {@code ConstraintViolationException} é lançada.
 * O frontend pode exibir erros por campo lendo {@code fieldErrors}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ValidationErrorResponse(
        boolean success,
        String message,
        int statusCode,
        Map<String, String> fieldErrors
) {

    public ValidationErrorResponse(String message, Map<String, String> fieldErrors) {
        this(false, message, 400, fieldErrors);
    }
}
