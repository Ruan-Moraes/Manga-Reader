package com.toonlira.translationgateway.presentation;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.UNAUTHORIZED;

import com.toonlira.translationgateway.application.CreateInstallationUseCase;
import com.toonlira.translationgateway.application.CreateSessionUseCase;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.infrastructure.security.SessionAuthenticationFilter;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Identity remains compatible with v1. Content processing is exclusively the volatile v2 contract. */
@RestController
@Profile("!worker")
@RequestMapping("/v1/anonymous")
public class GatewayController {
    private final CreateInstallationUseCase installations;
    private final CreateSessionUseCase sessions;
    public GatewayController(CreateInstallationUseCase installations, CreateSessionUseCase sessions) {
        this.installations = installations; this.sessions = sessions;
    }
    @PostMapping("/installations")
    ResponseEntity<InstallationCreated> installation() {
        var result = installations.execute();
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
            .body(new InstallationCreated("1.0", result.installationRef(), result.credential(), result.createdAt()));
    }
    @PostMapping("/sessions")
    ResponseEntity<SessionCreated> session(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization,
                                          @Valid @RequestBody SessionRequest request) {
        var credential = SessionAuthenticationFilter.bearer(authorization);
        if (credential == null) throw new GatewayException(UNAUTHORIZED, 401, false);
        var result = sessions.execute(request.installationRef(), credential);
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
            .body(new SessionCreated("1.0", result.accessToken(), result.expiresAt()));
    }
    public record SessionRequest(@NotNull UUID installationRef) { }
    public record InstallationCreated(String contractVersion, UUID installationRef, String credential, Instant createdAt) { }
    public record SessionCreated(String contractVersion, String accessToken, Instant expiresAt) { }
}
