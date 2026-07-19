package com.mangareader.infrastructure.security.jwt;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.mangareader.application.auth.port.TokenPort;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * Implementação do {@link TokenPort} usando jjwt (JSON Web Token).
 */
@Component
public class JwtTokenProvider implements TokenPort {
    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);
    private static final long DEFAULT_PASSWORD_RESET_EXPIRATION = Duration.ofMinutes(30).toMillis();

    private final SecretKey secretKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;
    private final long passwordResetExpiration;
    private final Clock clock;

    @Autowired
    public JwtTokenProvider(JwtProperties properties) {
        this(properties.secret(), properties.accessTokenExpiration(), properties.refreshTokenExpiration(),
                properties.passwordResetExpiration(), Clock.systemUTC());
    }

    public JwtTokenProvider(String secret, long accessTokenExpiration, long refreshTokenExpiration) {
        this(secret, accessTokenExpiration, refreshTokenExpiration,
                DEFAULT_PASSWORD_RESET_EXPIRATION, Clock.systemUTC());
    }

    JwtTokenProvider(String secret, long accessTokenExpiration, long refreshTokenExpiration,
            long passwordResetExpiration, Clock clock) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(
                Base64.getEncoder().encodeToString(secret.getBytes())
        ));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.passwordResetExpiration = passwordResetExpiration;
        this.clock = clock;
    }

    @Override
    public String generateAccessToken(UUID userId, String email, String role) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", "access")
                .claim("email", email)
                .claim("role", role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(accessTokenExpiration)))
                .signWith(secretKey)
                .compact();
    }

    @Override
    public String generateRefreshToken(UUID userId) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(userId.toString())
                .id(UUID.randomUUID().toString())
                .claim("type", "refresh")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(refreshTokenExpiration)))
                .signWith(secretKey)
                .compact();
    }

    @Override
    public UUID extractUserId(String token) {
        return UUID.fromString(extractClaims(token).getSubject());
    }

    @Override
    public String extractEmail(String token) {
        return extractClaims(token).get("email", String.class);
    }

    @Override
    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);

            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Token inválido: {}", e.getMessage());

            return false;
        }
    }

    @Override
    public String generatePasswordResetToken(UUID userId, String email, String passwordHash) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(userId.toString())
                .id(UUID.randomUUID().toString())
                .claim("email", email)
                .claim("type", "password_reset")
                .claim("passwordState", passwordState(passwordHash))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(passwordResetExpiration)))
                .signWith(secretKey)
                .compact();
    }

    @Override
    public boolean matchesPasswordState(String token, String passwordHash) {
        String tokenState = extractClaims(token).get("passwordState", String.class);
        if (tokenState == null) return false;
        return MessageDigest.isEqual(tokenState.getBytes(StandardCharsets.UTF_8),
                passwordState(passwordHash).getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Duration passwordResetExpiration() {
        return Duration.ofMillis(passwordResetExpiration);
    }

    @Override
    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    @Override
    public String extractType(String token) {
        return extractClaims(token).get("type", String.class);
    }

    @Override
    public String extractTokenId(String token) {
        return extractClaims(token).getId();
    }

    @Override
    public LocalDateTime extractExpiration(String token) {
        return LocalDateTime.ofInstant(
                extractClaims(token).getExpiration().toInstant(), ZoneId.systemDefault()
        );
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .clock(() -> Date.from(clock.instant()))
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String passwordState(String passwordHash) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getEncoded(), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(passwordHash.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException exception) {
            throw new IllegalStateException("HMAC-SHA256 indisponível na JVM", exception);
        }
    }
}
