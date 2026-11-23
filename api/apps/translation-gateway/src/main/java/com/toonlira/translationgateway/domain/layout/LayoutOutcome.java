package com.toonlira.translationgateway.domain.layout;

import java.time.Instant;
import java.util.Set;

public record LayoutOutcome(Status status, String objectKey, String sha256, String errorCode,
                            Instant startedAt, Instant completedAt) {
    public enum Status { SUCCEEDED, FAILED }
    public LayoutOutcome {
        if (status == null || startedAt == null || completedAt == null || completedAt.isBefore(startedAt))
            throw new IllegalArgumentException("Invalid layout timestamps");
        if (status == Status.SUCCEEDED && (objectKey == null || objectKey.isBlank() || objectKey.length() > 512
            || sha256 == null || !sha256.matches("[0-9a-f]{64}") || errorCode != null))
            throw new IllegalArgumentException("Invalid layout artifact");
        if (status == Status.FAILED && (objectKey != null || sha256 != null || errorCode == null
            || !Set.of("layout-unavailable", "layout-timeout", "layout-invalid-response", "layout-limit-exceeded").contains(errorCode)))
            throw new IllegalArgumentException("Invalid layout failure");
    }
}
