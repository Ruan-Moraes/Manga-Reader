package com.mangareader.infrastructure.security.ratelimit;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangareader.shared.dto.ApiErrorCode;
import com.mangareader.shared.dto.ApiErrorResponse;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Filtro de rate limiting baseado em IP usando Bucket4j.
 * <p>
 * Configuração: 100 requisições por minuto por IP; endpoints de credencial
 * ({@code POST /api/auth/*}) têm bucket próprio mais estrito (10/min) —
 * brute force de senha e farming de refresh merecem limite menor que
 * navegação. IPs que excedem o limite recebem HTTP 429 Too Many Requests.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {
    private static final int REQUESTS_PER_MINUTE = 100;
    private static final int BURST_CAPACITY = 120;
    private static final int AUTH_REQUESTS_PER_MINUTE = 10;
    private static final int AUTH_BURST_CAPACITY = 15;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String clientIp = resolveClientIp(request);

        Bucket bucket = isAuthSensitive(request)
                ? buckets.computeIfAbsent(clientIp + "|auth", this::createAuthBucket)
                : buckets.computeIfAbsent(clientIp, this::createBucket);

        var probe = bucket.tryConsumeAndReturnRemaining(1);

        response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));

        if (probe.isConsumed()) {
            filterChain.doFilter(request, response);
        } else {
            long waitSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;

            log.warn("Rate limit excedido para IP: {} — aguardar {}s", clientIp, waitSeconds);

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", String.valueOf(waitSeconds));

            var body = new ApiErrorResponse(
                    ApiErrorCode.RATE_LIMIT_EXCEEDED,
                    "Limite de requisições excedido. Tente novamente em " + waitSeconds + " segundos.",
                    HttpStatus.TOO_MANY_REQUESTS.value()
            );

            objectMapper.writeValue(response.getOutputStream(), body);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        return path.startsWith("/actuator/health")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/api-docs")
                || path.startsWith("/v3/api-docs");
    }

    /** POSTs de credencial (sign-in, sign-up, refresh, logout, forgot/reset). */
    private boolean isAuthSensitive(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI().startsWith("/api/auth/");
    }

    private Bucket createBucket(String key) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(BURST_CAPACITY)
                        .refillGreedy(REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private Bucket createAuthBucket(String key) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(AUTH_BURST_CAPACITY)
                        .refillGreedy(AUTH_REQUESTS_PER_MINUTE, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");

        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");

        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }
}
