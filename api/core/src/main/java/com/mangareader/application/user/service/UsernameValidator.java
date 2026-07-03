package com.mangareader.application.user.service;

import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/**
 * Valida o handle público do usuário (DT-48): formato {@code ^[a-z0-9_]{3,30}$}
 * (espelha o CHECK da V39) e lista de reservados. A unicidade é checada pelo
 * use case (índice único funcional {@code lower(username)} como guarda final).
 */
@Component
public class UsernameValidator {

    private static final Pattern FORMAT = Pattern.compile("^[a-z0-9_]{3,30}$");

    private static final Set<String> RESERVED = Set.of(
            "admin", "administrator", "moderator", "mod", "staff", "support",
            "me", "system", "root", "mangareader", "manga_reader", "api",
            "settings", "config", "login", "signup", "auth", "anonymous", "null");

    /**
     * @throws IllegalArgumentException formato inválido ou reservado (HTTP 400).
     */
    public void validate(String username) {
        if (!FORMAT.matcher(username).matches()) {
            throw new IllegalArgumentException(
                    "Username inválido: use 3–30 caracteres entre letras minúsculas, números e _");
        }

        if (RESERVED.contains(username)) {
            throw new IllegalArgumentException("Username reservado: " + username);
        }
    }
}
