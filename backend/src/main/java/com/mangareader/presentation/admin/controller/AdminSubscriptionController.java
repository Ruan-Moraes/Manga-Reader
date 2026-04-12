package com.mangareader.presentation.admin.controller;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.subscription.usecase.admin.CreateSubscriptionPlanUseCase;
import com.mangareader.application.subscription.usecase.admin.GetSubscriptionAuditLogsUseCase;
import com.mangareader.application.subscription.usecase.admin.GetSubscriptionGrowthUseCase;
import com.mangareader.application.subscription.usecase.admin.GetSubscriptionSummaryUseCase;
import com.mangareader.application.subscription.usecase.admin.GrantSubscriptionUseCase;
import com.mangareader.application.subscription.usecase.admin.ListSubscriptionPlansAdminUseCase;
import com.mangareader.application.subscription.usecase.admin.ListSubscriptionsAdminUseCase;
import com.mangareader.application.subscription.usecase.admin.RevokeSubscriptionUseCase;
import com.mangareader.application.subscription.usecase.admin.UpdateSubscriptionPlanUseCase;
import com.mangareader.application.subscription.usecase.admin.UpdateSubscriptionStatusAdminUseCase;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.presentation.admin.dto.AdminSubscriptionResponse;
import com.mangareader.presentation.admin.dto.CreateSubscriptionPlanRequest;
import com.mangareader.presentation.admin.dto.GrantSubscriptionRequest;
import com.mangareader.presentation.admin.dto.SubscriptionAuditLogResponse;
import com.mangareader.presentation.admin.dto.SubscriptionGrowthResponse;
import com.mangareader.presentation.admin.dto.SubscriptionSummaryResponse;
import com.mangareader.presentation.admin.dto.UpdateSubscriptionPlanRequest;
import com.mangareader.presentation.admin.dto.UpdateSubscriptionStatusRequest;
import com.mangareader.presentation.admin.mapper.AdminSubscriptionMapper;
import com.mangareader.presentation.subscription.dto.SubscriptionPlanResponse;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints administrativos para gerenciamento de assinaturas.
 * Protegidos por {@code /api/admin/**} no SecurityConfig (ROLE_ADMIN).
 */
@RestController
@RequestMapping("/api/admin/subscriptions")
@RequiredArgsConstructor
public class AdminSubscriptionController {

    private final ListSubscriptionsAdminUseCase listSubscriptionsUseCase;
    private final UpdateSubscriptionStatusAdminUseCase updateStatusUseCase;
    private final GetSubscriptionSummaryUseCase summaryUseCase;
    private final ListSubscriptionPlansAdminUseCase listPlansUseCase;
    private final CreateSubscriptionPlanUseCase createPlanUseCase;
    private final UpdateSubscriptionPlanUseCase updatePlanUseCase;
    private final GrantSubscriptionUseCase grantUseCase;
    private final RevokeSubscriptionUseCase revokeUseCase;
    private final GetSubscriptionAuditLogsUseCase auditLogsUseCase;
    private final GetSubscriptionGrowthUseCase growthUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminSubscriptionResponse>>> listSubscriptions(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));
        SubscriptionStatus statusFilter = (status != null && !status.isBlank())
                ? SubscriptionStatus.valueOf(status.toUpperCase())
                : null;
        var result = listSubscriptionsUseCase.execute(statusFilter, pageable);
        var mapped = result.map(AdminSubscriptionMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<SubscriptionSummaryResponse>> getSummary() {
        var counts = summaryUseCase.execute();
        return ResponseEntity.ok(ApiResponse.success(AdminSubscriptionMapper.toSummaryResponse(counts)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminSubscriptionResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSubscriptionStatusRequest request
    ) {
        SubscriptionStatus newStatus = SubscriptionStatus.valueOf(request.status().toUpperCase());
        var subscription = updateStatusUseCase.execute(id, newStatus);
        return ResponseEntity.ok(ApiResponse.success(AdminSubscriptionMapper.toResponse(subscription)));
    }

    @PostMapping("/grant")
    public ResponseEntity<ApiResponse<AdminSubscriptionResponse>> grantSubscription(
            @Valid @RequestBody GrantSubscriptionRequest request
    ) {
        var subscription = grantUseCase.execute(request.userId(), request.planId());
        return ResponseEntity.status(201).body(ApiResponse.created(AdminSubscriptionMapper.toResponse(subscription)));
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<ApiResponse<AdminSubscriptionResponse>> revokeSubscription(
            @PathVariable UUID id
    ) {
        var subscription = revokeUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(AdminSubscriptionMapper.toResponse(subscription)));
    }

    // ── Plans ──────────────────────────────────────────────────────────

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<PageResponse<SubscriptionPlanResponse>>> listPlans(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "period"));
        var result = listPlansUseCase.execute(pageable);
        var mapped = result.map(AdminSubscriptionMapper::toPlanResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @PostMapping("/plans")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> createPlan(
            @Valid @RequestBody CreateSubscriptionPlanRequest request
    ) {
        var plan = createPlanUseCase.execute(
                request.period(), request.priceInCents(), request.description(), request.features());
        return ResponseEntity.status(201).body(ApiResponse.created(AdminSubscriptionMapper.toPlanResponse(plan)));
    }

    @PatchMapping("/plans/{id}")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> updatePlan(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSubscriptionPlanRequest request
    ) {
        var plan = updatePlanUseCase.execute(
                id, request.priceInCents(), request.description(), request.features(), request.active());
        return ResponseEntity.ok(ApiResponse.success(AdminSubscriptionMapper.toPlanResponse(plan)));
    }

    // ── Audit Logs ─────────────────────────────────────────────────────

    @GetMapping("/{id}/logs")
    public ResponseEntity<ApiResponse<PageResponse<SubscriptionAuditLogResponse>>> getAuditLogs(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = auditLogsUseCase.executeBySubscription(id, pageable);
        var mapped = result.map(AdminSubscriptionMapper::toAuditLogResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    // ── Growth Series ──────────────────────────────────────────────────

    @GetMapping("/growth-series")
    public ResponseEntity<ApiResponse<SubscriptionGrowthResponse>> getGrowthSeries(
            @RequestParam(defaultValue = "12") int months
    ) {
        var growth = growthUseCase.execute(Math.min(months, 24));

        var entries = growth.entries().stream()
                .map(e -> new SubscriptionGrowthResponse.MonthlyGrowthEntry(
                        e.yearMonth(), e.newSubscriptions(), e.cancelledSubscriptions(), e.netGrowth()))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(
                new SubscriptionGrowthResponse(entries, growth.totalNew(), growth.totalCancelled())));
    }
}
