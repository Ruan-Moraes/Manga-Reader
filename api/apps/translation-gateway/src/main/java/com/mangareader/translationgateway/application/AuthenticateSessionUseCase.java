package com.mangareader.translationgateway.application;

import com.mangareader.translationgateway.application.port.CredentialHasher;
import com.mangareader.translationgateway.application.port.GatewayRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticateSessionUseCase {
    private final GatewayRepository repository;
    private final CredentialHasher hasher;
    private final Clock clock;

    public AuthenticateSessionUseCase(GatewayRepository repository, CredentialHasher hasher, Clock clock) {
        this.repository = repository;
        this.hasher = hasher;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Optional<UUID> execute(String token) {
        if (token == null || token.length() < 32 || token.length() > 512) return Optional.empty();
        return repository.authenticateSession(hasher.hashToken(token), Instant.now(clock));
    }
}
