package com.mangareader.infrastructure.security.ratelimit;

import java.io.IOException;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangareader.shared.dto.ApiErrorCode;
import com.mangareader.shared.dto.ApiErrorResponse;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * Filtro de rate limiting distribuído por IP, com Redis e fallback local explícito.
 * <p>
 * Endpoints de credencial usam bucket próprio mais estrito que a navegação geral.
 * Forwarded headers só são aceitos quando o peer imediato está na lista de proxies
 * confiáveis; cadeias malformadas voltam de forma segura ao endereço remoto.
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private final ObjectMapper objectMapper;
    private final RateLimitStore store;
    private final RateLimitProperties properties;

    @Autowired
    public RateLimitFilter(ObjectMapper objectMapper, ObjectProvider<RateLimitStore> stores,
            ObjectProvider<RateLimitProperties> configuredProperties) {
        this(objectMapper, stores.getIfAvailable(LocalFallbackStore::new),
                configuredProperties.getIfAvailable(RateLimitFilter::defaultProperties));
    }

    public RateLimitFilter(ObjectMapper objectMapper, RateLimitStore store, RateLimitProperties properties) {
        this.objectMapper = objectMapper;
        this.store = store;
        this.properties = properties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String clientIp = resolveClientIp(request);
        boolean authSensitive = isAuthSensitive(request);
        RateLimitProperties.Policy policy = authSensitive ? properties.auth() : properties.general();
        var probe = store.consume(clientIp + (authSensitive ? "|auth" : "|general"),
                policy.capacity(), policy.window());

        response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.remaining()));

        if (probe.allowed()) {
            filterChain.doFilter(request, response);
            return;
        }

        long waitSeconds = probe.retryAfterSeconds();
        log.warn("Rate limit excedido para IP: {} — aguardar {}s", clientIp, waitSeconds);
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Retry-After", String.valueOf(waitSeconds));
        var body = new ApiErrorResponse(
                ApiErrorCode.RATE_LIMIT_EXCEEDED,
                "Limite de requisições excedido. Tente novamente em " + waitSeconds + " segundos.",
                HttpStatus.TOO_MANY_REQUESTS.value());
        objectMapper.writeValue(response.getOutputStream(), body);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator/health")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/api-docs")
                || path.startsWith("/v3/api-docs");
    }

    private boolean isAuthSensitive(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod())
                && request.getRequestURI().startsWith("/api/auth/");
    }

    private String resolveClientIp(HttpServletRequest request) {
        String remoteAddress = request.getRemoteAddr();
        if (!isTrustedProxy(remoteAddress)) return remoteAddress;

        String xff = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xff)) {
            String[] forwarded = xff.split(",", -1);
            for (String candidate : forwarded) {
                if (!isIpLiteral(candidate.trim())) return remoteAddress;
            }
            for (int index = forwarded.length - 1; index >= 0; index--) {
                String candidate = forwarded[index].trim();
                if (!isTrustedProxy(candidate)) return candidate;
            }
            return forwarded[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        return StringUtils.hasText(realIp) && isIpLiteral(realIp.trim())
                ? realIp.trim()
                : remoteAddress;
    }

    private boolean isTrustedProxy(String address) {
        if (!isIpLiteral(address)) return false;
        return properties.trustedProxies().stream()
                .anyMatch(cidr -> new IpAddressMatcher(cidr).matches(address));
    }

    private boolean isIpLiteral(String value) {
        if (!StringUtils.hasText(value)) return false;
        if (value.indexOf(':') >= 0) {
            if (!value.matches("[0-9a-fA-F:.]+")) return false;
            try {
                return InetAddress.getByName(value) instanceof Inet6Address;
            } catch (UnknownHostException ignored) {
                return false;
            }
        }
        String[] octets = value.split("\\.", -1);
        if (octets.length != 4) return false;
        for (String octet : octets) {
            if (!octet.matches("0|[1-9][0-9]{0,2}")) return false;
            if (Integer.parseInt(octet) > 255) return false;
        }
        return true;
    }

    private static RateLimitProperties defaultProperties() {
        return new RateLimitProperties(
                new RateLimitProperties.Policy(10_000, Duration.ofMinutes(1)),
                new RateLimitProperties.Policy(10_000, Duration.ofMinutes(1)),
                java.util.List.of("127.0.0.1", "::1"));
    }

    private static final class LocalFallbackStore implements RateLimitStore {
        private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

        @Override
        public Decision consume(String key, long capacity, Duration window) {
            long now = System.currentTimeMillis();
            Window current = windows.compute(key, (ignored, existing) ->
                    existing == null || existing.expiresAt <= now
                            ? new Window(1, now + window.toMillis())
                            : new Window(existing.count + 1, existing.expiresAt));
            return new Decision(current.count <= capacity, Math.max(0, capacity - current.count),
                    Math.max(1, (current.expiresAt - now + 999) / 1000));
        }

        private record Window(long count, long expiresAt) {}
    }
}
