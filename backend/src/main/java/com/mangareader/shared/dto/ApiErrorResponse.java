package com.mangareader.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Shape de erro HTTP padronizado.
 * <p>
 * Compatível com o frontend ({@code ApiErrorResponse} em httpTypes.ts):
 * <pre>{ success: false, message: string, statusCode: number, rawData?: unknown }</pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        boolean success,
        String message,
        int statusCode,
        Object rawData
) {

    public ApiErrorResponse(String message, int statusCode) {
        this(false, message, statusCode, null);
    }

    public ApiErrorResponse(String message, int statusCode, Object rawData) {
        this(false, message, statusCode, rawData);
    }
}
