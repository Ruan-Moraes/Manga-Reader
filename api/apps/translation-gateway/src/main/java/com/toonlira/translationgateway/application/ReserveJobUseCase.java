package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.INSTALLATION_REVOKED;
import static com.toonlira.translationgateway.domain.GatewayErrorCode.JOB_STATE_CONFLICT;
import static com.toonlira.translationgateway.domain.GatewayErrorCode.QUOTA_EXCEEDED;
import static com.toonlira.translationgateway.domain.GatewayErrorCode.UNAUTHORIZED;

import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReserveJobUseCase {
    private final GatewayRepository repository;
    private final GatewayProperties properties;

    public ReserveJobUseCase(GatewayRepository repository, GatewayProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    @Transactional
    public Result execute(GatewayRepository.NewJob candidate) {
        var installation = repository.findInstallationForUpdate(candidate.installationId())
            .orElseThrow(() -> new GatewayException(UNAUTHORIZED, 401, false));
        if (!installation.active()) throw new GatewayException(INSTALLATION_REVOKED, 403, false);

        var existing = repository.findByIdempotency(candidate.installationId(), candidate.idempotencyKey());
        if (existing.isPresent()) {
            if (!existing.get().requestFingerprint().equals(candidate.requestFingerprint())) {
                throw new GatewayException(JOB_STATE_CONFLICT, 409, false);
            }
            return new Result(existing.get(), false);
        }

        var day = LocalDate.ofInstant(candidate.now(), ZoneOffset.UTC);
        var dayStart = day.atStartOfDay().toInstant(ZoneOffset.UTC);
        var dayEnd = day.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        repository.acquireGlobalQuotaLock(day.toEpochDay());
        if (repository.countInstallationJobs(candidate.installationId(), dayStart, dayEnd) >= properties.getInstallationDailyQuota()
            || repository.countGlobalJobs(dayStart, dayEnd) >= properties.getGlobalDailyQuota()) {
            throw new GatewayException(QUOTA_EXCEEDED, 429, true);
        }
        return new Result(repository.insertJob(candidate), true);
    }

    public record Result(ProcessingJob job, boolean created) { }
}
