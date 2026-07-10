package com.mangareader.presentation.auth.support;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Fabrica o cookie httpOnly do refresh token para clientes web.
 * <p>
 * SameSite=Strict: o cookie só é enviado em XHR same-site para
 * {@code /api/auth/refresh|logout} — nunca em navegação top-level — então
 * Strict não custa nada e elimina CSRF no refresh. {@code Path=/api/auth}
 * reduz a superfície de exposição. {@code Secure} vem de config: false em
 * dev http (senão o browser descarta), true em produção.
 */
@Component
public class RefreshTokenCookieFactory {
    public static final String COOKIE_NAME = "refresh_token";

    private final boolean secure;
    private final Duration maxAge;

    public RefreshTokenCookieFactory(
            @Value("${app.auth.cookie-secure}") boolean secure,
            @Value("${app.jwt.refresh-token-expiration}") long refreshTokenExpirationMs
    ) {
        this.secure = secure;
        this.maxAge = Duration.ofMillis(refreshTokenExpirationMs);
    }

    public ResponseCookie create(String refreshToken) {
        return builder(refreshToken).maxAge(maxAge).build();
    }

    /** Cookie com Max-Age=0 — instrui o browser a remover o refresh token. */
    public ResponseCookie expire() {
        return builder("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder builder(String value) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/api/auth");
    }
}
