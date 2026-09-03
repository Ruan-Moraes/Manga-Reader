package com.mangareader.translationgateway.application;

import static com.mangareader.translationgateway.domain.GatewayErrorCode.JOB_NOT_FOUND;

import com.mangareader.translationgateway.application.port.GatewayRepository;
import com.mangareader.translationgateway.domain.GatewayException;
import com.mangareader.translationgateway.domain.ProcessingJob;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GetJobUseCase {
    private final GatewayRepository repository;

    public GetJobUseCase(GatewayRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ProcessingJob byRef(UUID installationId, UUID jobRef) {
        return repository.findByJobRef(installationId, jobRef)
            .orElseThrow(() -> new GatewayException(JOB_NOT_FOUND, 404, false));
    }

    @Transactional(readOnly = true)
    public ProcessingJob byIdempotency(UUID installationId, UUID key) {
        return repository.findByIdempotency(installationId, key)
            .orElseThrow(() -> new GatewayException(JOB_NOT_FOUND, 404, false));
    }
}
