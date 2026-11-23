package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.toonlira.translationgateway.application.port.ResultDownloadRepository;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.domain.rendering.ReadyResultReference;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JobResultSnapshotUseCase {
    private final GetJobUseCase getJob;
    private final ResultDownloadRepository repository;
    public JobResultSnapshotUseCase(GetJobUseCase getJob, ResultDownloadRepository repository) {
        this.getJob = getJob;
        this.repository = repository;
    }

    @Transactional public Snapshot byRef(UUID owner, UUID ref) { return snapshot(owner, getJob.byRef(owner, ref)); }
    @Transactional public Snapshot byIdempotency(UUID owner, UUID key) {
        return snapshot(owner, getJob.byIdempotency(owner, key));
    }

    private Snapshot snapshot(UUID owner, ProcessingJob job) {
        if (job.status() != JobStatus.READY) return new Snapshot(job, null);
        var metadata = repository.findReady(owner, job.jobRef());
        if (metadata.isPresent()) return new Snapshot(job, metadata.get());
        // ACK can have committed between the first read and the locking projection.
        var current = getJob.byRef(owner, job.jobRef());
        if (current.status() != JobStatus.READY) return new Snapshot(current, null);
        throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
    }

    public record Snapshot(ProcessingJob job, ReadyResultReference reference) {
        public Snapshot {
            if (job == null || (job.status() == JobStatus.READY) != (reference != null)) {
                throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
            }
        }
        @Override public String toString() { return "JobResultSnapshot[redacted]"; }
    }
}
