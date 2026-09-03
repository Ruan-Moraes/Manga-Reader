package com.mangareader.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mangareader.translationgateway.application.config.GatewayProperties;
import com.mangareader.translationgateway.application.port.CredentialHasher;
import com.mangareader.translationgateway.application.port.GatewayRepository;
import com.mangareader.translationgateway.application.port.OpaqueTokenGenerator;
import com.mangareader.translationgateway.domain.GatewayErrorCode;
import com.mangareader.translationgateway.domain.GatewayException;
import com.mangareader.translationgateway.domain.Installation;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class IdentityUseCasesTest {
    private static final Instant NOW = Instant.parse("2026-09-02T12:00:00Z");

    @Test
    void shouldReturnTheInstallationCredentialOnceAndPersistOnlyItsArgonHash() {
        var repository = mock(GatewayRepository.class);
        var generator = mock(OpaqueTokenGenerator.class);
        var hasher = mock(CredentialHasher.class);
        var capabilities = mock(GetCapabilitiesUseCase.class);
        when(generator.generate()).thenReturn("credential-value");
        when(hasher.hashCredential("credential-value")).thenReturn("argon2id-hash");

        var result = new CreateInstallationUseCase(repository, generator, hasher, capabilities,
            Clock.fixed(NOW, ZoneOffset.UTC)).execute();

        assertThat(result.credential()).isEqualTo("credential-value");
        verify(repository).createInstallation(result.installationRef(), "argon2id-hash", NOW);
    }

    @Test
    void shouldCreateAFifteenMinuteSessionAndPersistOnlyTheBearerHash() {
        var repository = mock(GatewayRepository.class);
        var generator = mock(OpaqueTokenGenerator.class);
        var hasher = mock(CredentialHasher.class);
        var capabilities = mock(GetCapabilitiesUseCase.class);
        var properties = new GatewayProperties();
        var installationId = UUID.randomUUID();
        var installation = new Installation(installationId, "argon2id-hash", "ACTIVE", NOW.minusSeconds(60));
        when(repository.findInstallationForUpdate(installationId)).thenReturn(Optional.of(installation));
        when(hasher.matchesCredential("c".repeat(43), "argon2id-hash")).thenReturn(true);
        when(generator.generate()).thenReturn("t".repeat(43));
        when(hasher.hashToken("t".repeat(43))).thenReturn("a".repeat(64));

        var result = new CreateSessionUseCase(repository, hasher, generator, properties, capabilities,
            Clock.fixed(NOW, ZoneOffset.UTC)).execute(installationId, "c".repeat(43));

        assertThat(result.accessToken()).isEqualTo("t".repeat(43));
        assertThat(result.expiresAt()).isEqualTo(NOW.plusSeconds(900));
        verify(repository).createSession(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq(installationId),
            org.mockito.ArgumentMatchers.eq("a".repeat(64)), org.mockito.ArgumentMatchers.eq(NOW),
            org.mockito.ArgumentMatchers.eq(NOW.plusSeconds(900)));
    }

    @Test
    void shouldRejectARevokedInstallationWithoutIssuingASession() {
        var repository = mock(GatewayRepository.class);
        var installationId = UUID.randomUUID();
        when(repository.findInstallationForUpdate(installationId))
            .thenReturn(Optional.of(new Installation(installationId, "hash", "REVOKED", NOW.minusSeconds(60))));

        var useCase = new CreateSessionUseCase(repository, mock(CredentialHasher.class), mock(OpaqueTokenGenerator.class),
            new GatewayProperties(), mock(GetCapabilitiesUseCase.class), Clock.fixed(NOW, ZoneOffset.UTC));

        assertThatThrownBy(() -> useCase.execute(installationId, "c".repeat(43)))
            .isInstanceOfSatisfying(GatewayException.class,
                error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.INSTALLATION_REVOKED));
        verify(repository, never()).createSession(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void shouldAuthenticateOnlyAWellFormedOpaqueBearerAtTheCurrentInstant() {
        var repository = mock(GatewayRepository.class);
        var hasher = mock(CredentialHasher.class);
        var installationId = UUID.randomUUID();
        var token = "t".repeat(43);
        when(hasher.hashToken(token)).thenReturn("a".repeat(64));
        when(repository.authenticateSession("a".repeat(64), NOW)).thenReturn(Optional.of(installationId));
        var useCase = new AuthenticateSessionUseCase(repository, hasher, Clock.fixed(NOW, ZoneOffset.UTC));

        assertThat(useCase.execute(token)).contains(installationId);
        assertThat(useCase.execute("short")).isEmpty();
        verify(repository).authenticateSession("a".repeat(64), NOW);
    }
}
