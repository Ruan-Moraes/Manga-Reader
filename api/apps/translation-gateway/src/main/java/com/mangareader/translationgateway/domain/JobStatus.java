package com.mangareader.translationgateway.domain;

import java.util.Set;

public enum JobStatus {
    QUEUED,
    OCR,
    TRANSLATING,
    RENDERING,
    READY,
    FAILED,
    CANCEL_PENDING,
    CANCELLED,
    RESULT_EXPIRED;

    private static final Set<JobStatus> TERMINAL = Set.of(READY, FAILED, CANCELLED, RESULT_EXPIRED);

    public boolean terminal() {
        return TERMINAL.contains(this);
    }

    public boolean canTransitionTo(JobStatus target) {
        return switch (this) {
            case QUEUED -> Set.of(OCR, FAILED, CANCEL_PENDING, CANCELLED).contains(target);
            case OCR -> Set.of(TRANSLATING, FAILED, CANCEL_PENDING).contains(target);
            case TRANSLATING -> Set.of(RENDERING, FAILED, CANCEL_PENDING).contains(target);
            case RENDERING -> Set.of(READY, FAILED, CANCEL_PENDING).contains(target);
            case READY -> target == RESULT_EXPIRED;
            case CANCEL_PENDING -> target == CANCELLED;
            case FAILED, CANCELLED, RESULT_EXPIRED -> false;
        };
    }

    public CancellationDecision cancellationDecision(DispatchStatus dispatchStatus) {
        if (this == CANCELLED || this == CANCEL_PENDING) return CancellationDecision.ALREADY_APPLIED;
        if (terminal()) return CancellationDecision.REJECT;
        if (this == QUEUED && dispatchStatus == DispatchStatus.PENDING) {
            return CancellationDecision.CANCEL_IMMEDIATELY;
        }
        return CancellationDecision.REQUEST_WORKER;
    }

    public enum CancellationDecision {
        CANCEL_IMMEDIATELY,
        REQUEST_WORKER,
        ALREADY_APPLIED,
        REJECT
    }
}
