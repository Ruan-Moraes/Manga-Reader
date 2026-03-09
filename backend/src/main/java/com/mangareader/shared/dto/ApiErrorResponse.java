package com.mangareader.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Shape de erro HTTP padronizado.
 * <p>
 * Compatível com o frontend ({@code ApiErrorResponse} em httpTypes.ts):
 * <pre>{ success: false, code: string, message: string, statusCode: number, rawData?: unknown }</pre>
 * <p>
 * O campo {@code code} contém um código técnico da {@link ApiErrorCode} que o
 * frontend mapeia para mensagens amigáveis ao usuário.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        boolean success,
        String code,
        String message,
        int statusCode,
        Object rawData
) {
    public ApiErrorResponse(String code, String message, int statusCode) {
        this(false, code, message, statusCode, null);
    }

    public ApiErrorResponse(String code, String message, int statusCode, Object rawData) {
        this(false, code, message, statusCode, rawData);
    }
}
