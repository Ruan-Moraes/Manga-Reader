package com.mangareader.translationgateway.application;

import com.mangareader.translationgateway.application.port.CredentialHasher;
import com.mangareader.translationgateway.application.port.GatewayRepository;
import com.mangareader.translationgateway.application.port.OpaqueTokenGenerator;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreateInstallationUseCase {
    private final GatewayRepository repository;
    private final OpaqueTokenGenerator tokenGenerator;
    private final CredentialHasher hasher;
    private final GetCapabilitiesUseCase capabilities;
    private final Clock clock;

    public CreateInstallationUseCase(GatewayRepository repository, OpaqueTokenGenerator tokenGenerator,
                                     CredentialHasher hasher, GetCapabilitiesUseCase capabilities, Clock clock) {
        this.repository = repository;
        this.tokenGenerator = tokenGenerator;
        this.hasher = hasher;
        this.capabilities = capabilities;
        this.clock = clock;
    }

    @Transactional
    public Result execute() {
        capabilities.execute();
        var credential = tokenGenerator.generate();
        var id = UUID.randomUUID();
        var now = Instant.now(clock);
        repository.createInstallation(id, hasher.hashCredential(credential), now);
        return new Result(id, credential, now);
    }

    public record Result(UUID installationRef, String credential, Instant createdAt) { }
}
