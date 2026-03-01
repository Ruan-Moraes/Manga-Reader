package com.mangareader.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Wrapper padrão de resposta da API.
 * <p>
 * Compatível com o frontend ({@code ApiResponse<T>} em httpTypes.ts):
 * <pre>{ data: T, success: boolean, message?: string, statusCode?: number }</pre>
 *
 * @param <T> tipo do payload
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        T data,
        boolean success,
        String message,
        Integer statusCode
) {

    // ── Factory methods ─────────────────────────────────────────────────────

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, true, null, null);
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(data, true, message, null);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(data, true, "Recurso criado com sucesso.", 201);
    }

    public static <T> ApiResponse<T> error(String message, int statusCode) {
        return new ApiResponse<>(null, false, message, statusCode);
    }
}
