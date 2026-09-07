package com.toonlira.translationgateway.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.application.AuthenticateSessionUseCase;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.presentation.GatewayProblem;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SessionAuthenticationFilter extends OncePerRequestFilter {
    private final AuthenticateSessionUseCase authenticate;
    private final ObjectMapper objectMapper;

    public SessionAuthenticationFilter(AuthenticateSessionUseCase authenticate, ObjectMapper objectMapper) {
        this.authenticate = authenticate;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/v1/page-jobs");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        var token = bearer(request.getHeader("Authorization"));
        UUID installation;
        try {
            installation = authenticate.execute(token).orElse(null);
        } catch (GatewayException error) {
            writeProblem(response, error.status(), error.code(), error.retryable());
            return;
        } catch (RuntimeException error) {
            writeProblem(response, 503, GatewayErrorCode.STORAGE_UNAVAILABLE, true);
            return;
        }
        if (installation == null) {
            writeProblem(response, 401, GatewayErrorCode.UNAUTHORIZED, false);
            return;
        }
        var authentication = new UsernamePasswordAuthenticationToken(installation, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        try {
            chain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void writeProblem(HttpServletResponse response, int status, GatewayErrorCode code, boolean retryable)
        throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), GatewayProblem.of(code, status, retryable));
    }

    public static String bearer(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) return null;
        var value = authorization.substring(7).trim();
        return value.isEmpty() ? null : value;
    }
}
