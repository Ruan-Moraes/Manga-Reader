package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.INSTALLATION_REVOKED;
import static com.toonlira.translationgateway.domain.GatewayErrorCode.UNAUTHORIZED;

import com.toonlira.translationgateway.application.port.CredentialHasher;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.OpaqueTokenGenerator;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateSessionUseCase {
    private final GatewayRepository repository;
    private final CredentialHasher hasher;
    private final OpaqueTokenGenerator tokenGenerator;
    private final GatewayProperties properties;
    private final GetCapabilitiesUseCase capabilities;
    private final Clock clock;

    public CreateSessionUseCase(GatewayRepository repository, CredentialHasher hasher, OpaqueTokenGenerator tokenGenerator,
                                GatewayProperties properties, GetCapabilitiesUseCase capabilities, Clock clock) {
        this.repository = repository;
        this.hasher = hasher;
        this.tokenGenerator = tokenGenerator;
        this.properties = properties;
        this.capabilities = capabilities;
        this.clock = clock;
    }

    @Transactional
    public Result execute(UUID installationRef, String credential) {
        capabilities.execute();
        if (credential == null || credential.length() < 32 || credential.length() > 512) {
            throw new GatewayException(UNAUTHORIZED, 401, false);
        }
        var installation = repository.findInstallationForUpdate(installationRef)
            .orElseThrow(() -> new GatewayException(UNAUTHORIZED, 401, false));
        if (!installation.active()) throw new GatewayException(INSTALLATION_REVOKED, 403, false);
        if (!hasher.matchesCredential(credential, installation.credentialHash())) {
            throw new GatewayException(UNAUTHORIZED, 401, false);
        }
        var now = Instant.now(clock);
        var expiresAt = now.plus(properties.getSessionTtl());
        var token = tokenGenerator.generate();
        repository.createSession(UUID.randomUUID(), installation.id(), hasher.hashToken(token), now, expiresAt);
        repository.touchInstallation(installation.id(), now);
        return new Result(token, expiresAt);
    }

    public record Result(String accessToken, Instant expiresAt) { }
}
