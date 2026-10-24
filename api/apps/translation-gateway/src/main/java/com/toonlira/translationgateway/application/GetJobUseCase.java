package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.JOB_NOT_FOUND;

import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetJobUseCase {
    private final GatewayRepository repository;
    private final ResultExpirationUseCase expiration;

    public GetJobUseCase(GatewayRepository repository, ResultExpirationUseCase expiration) {
        this.repository = repository;
        this.expiration = expiration;
    }

    @Transactional
    public ProcessingJob byRef(UUID installationId, UUID jobRef) {
        expiration.expire(installationId, jobRef);
        return repository.findByJobRef(installationId, jobRef)
            .orElseThrow(() -> new GatewayException(JOB_NOT_FOUND, 404, false));
    }

    @Transactional
    public ProcessingJob byIdempotency(UUID installationId, UUID key) {
        var job = repository.findByIdempotency(installationId, key)
            .orElseThrow(() -> new GatewayException(JOB_NOT_FOUND, 404, false));
        if (job.status() != JobStatus.READY) return job;
        expiration.expire(installationId, job.jobRef());
        return repository.findByJobRef(installationId, job.jobRef())
            .orElseThrow(() -> new GatewayException(JOB_NOT_FOUND, 404, false));
    }
}
