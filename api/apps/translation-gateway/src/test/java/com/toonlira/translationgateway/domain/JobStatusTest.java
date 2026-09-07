package com.toonlira.translationgateway.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JobStatusTest {
    @Test
    void shouldAllowOnlyForwardProcessingAndTerminalTransitions() {
        assertThat(JobStatus.QUEUED.canTransitionTo(JobStatus.OCR)).isTrue();
        assertThat(JobStatus.OCR.canTransitionTo(JobStatus.TRANSLATING)).isTrue();
        assertThat(JobStatus.TRANSLATING.canTransitionTo(JobStatus.RENDERING)).isTrue();
        assertThat(JobStatus.RENDERING.canTransitionTo(JobStatus.READY)).isTrue();
        assertThat(JobStatus.READY.canTransitionTo(JobStatus.RESULT_EXPIRED)).isTrue();
        assertThat(JobStatus.READY.canTransitionTo(JobStatus.QUEUED)).isFalse();
        assertThat(JobStatus.FAILED.canTransitionTo(JobStatus.QUEUED)).isFalse();
    }

    @Test
    void shouldChooseCancellationFromTheDispatchBoundary() {
        assertThat(JobStatus.QUEUED.cancellationDecision(DispatchStatus.PENDING))
            .isEqualTo(JobStatus.CancellationDecision.CANCEL_IMMEDIATELY);
        assertThat(JobStatus.QUEUED.cancellationDecision(DispatchStatus.DISPATCHED))
            .isEqualTo(JobStatus.CancellationDecision.REQUEST_WORKER);
        assertThat(JobStatus.CANCEL_PENDING.cancellationDecision(DispatchStatus.DISPATCHED))
            .isEqualTo(JobStatus.CancellationDecision.ALREADY_APPLIED);
        assertThat(JobStatus.CANCELLED.cancellationDecision(DispatchStatus.CANCELLED))
            .isEqualTo(JobStatus.CancellationDecision.ALREADY_APPLIED);
        assertThat(JobStatus.READY.cancellationDecision(DispatchStatus.DISPATCHED))
            .isEqualTo(JobStatus.CancellationDecision.REJECT);
    }
}
