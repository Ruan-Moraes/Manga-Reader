package com.mangareader.infrastructure.security.config;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangareader.shared.dto.ApiErrorCode;
import com.mangareader.shared.dto.ApiErrorResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Tratamento unificado de exceções do Spring Security.
 * <p>
 * Garante que respostas 401 e 403 sigam o formato {@link ApiErrorResponse}
 * (incluindo {@link ApiErrorCode}) em vez do HTML padrão do Spring Security.
 */
@Component
@RequiredArgsConstructor
public class SecurityExceptionHandler implements AuthenticationEntryPoint, AccessDeniedHandler {
    private final ObjectMapper objectMapper;

    /**
     * 401 — Usuário não autenticado (token ausente, expirado ou inválido).
     */
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        writeError(response, HttpStatus.UNAUTHORIZED,
                ApiErrorCode.AUTH_UNAUTHENTICATED,
                "Autenticação necessária. Faça login para acessar este recurso.");
    }

    /**
     * 403 — Usuário autenticado mas sem permissão.
     */
    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        writeError(response, HttpStatus.FORBIDDEN,
                ApiErrorCode.AUTH_ACCESS_DENIED,
                "Acesso negado. Você não tem permissão para acessar este recurso.");
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String code, String message)
            throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        var body = new ApiErrorResponse(code, message, status.value());

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
