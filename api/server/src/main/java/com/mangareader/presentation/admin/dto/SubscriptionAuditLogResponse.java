package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SubscriptionAuditLogResponse(
        UUID id,
        UUID subscriptionId,
        UUID userId,
        String action,
        UUID performedBy,
        String details,
        LocalDateTime createdAt
) {}
