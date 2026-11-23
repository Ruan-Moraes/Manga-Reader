package com.toonlira.translationgateway.domain;

import java.time.Instant;
import java.util.UUID;

public record Installation(UUID id, String credentialHash, String status, Instant createdAt) {
    public boolean active() {
        return "ACTIVE".equals(status);
    }
}
