package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.RenderingPersistenceUseCase;
import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.io.IOException;

/** Child facade. Every transaction and its atomic cleanup intent execute in the parent. */
final class RenderingSessionPersistence extends RenderingPersistenceUseCase {
    RenderingSessionPersistence() { super(null, null); }
    static RenderingSessionProtocol.Reply call(String operation, RenderingJobRepository.Artifacts artifacts, Instant lease) {
        try {
            RenderingSessionProtocol.write(System.out, new RenderingSessionProtocol.Request(operation, artifacts, lease));
            return RenderingSessionProtocol.read(System.in, RenderingSessionProtocol.Reply.class);
        } catch (IOException error) { throw new RenderFileException(RenderFileException.Failure.UNAVAILABLE); }
    }
    @Override public RenderingJobRepository.WorkItem find(UUID ref) { return call("FIND", null, null).job(); }
    @Override public boolean originalAvailable(UUID id, Instant now) { return call("AVAILABLE", null, null).accepted(); }
    @Override public RenderingJobRepository.Claim claim(UUID ref, Instant now) { return call("CLAIM", null, null).claim(); }
    @Override public boolean complete(UUID id, RenderingJobRepository.Artifacts artifacts, Instant now) {
        return call("COMPLETE", artifacts, null).accepted();
    }
    @Override public void fail(UUID id, GatewayErrorCode code, Instant now) { call("FAIL", null, null); }
    @Override public void failUnclaimed(UUID id, GatewayErrorCode code, Instant now) { call("FAIL_UNCLAIMED", null, null); }
    @Override public List<String> failStale(Instant cutoff, Instant now, int limit) { throw new UnsupportedOperationException(); }
}
