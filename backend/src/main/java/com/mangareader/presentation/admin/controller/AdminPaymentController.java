package com.mangareader.presentation.admin.controller;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.payment.usecase.admin.GetFinancialSummaryUseCase;
import com.mangareader.application.payment.usecase.admin.GetPaymentDetailsUseCase;
import com.mangareader.application.payment.usecase.admin.ListPaymentsUseCase;
import com.mangareader.application.payment.usecase.admin.UpdatePaymentStatusUseCase;
import com.mangareader.domain.payment.valueobject.PaymentStatus;
import com.mangareader.presentation.admin.dto.AdminPaymentResponse;
import com.mangareader.presentation.admin.dto.FinancialSummaryResponse;
import com.mangareader.presentation.admin.dto.UpdatePaymentStatusRequest;
import com.mangareader.presentation.admin.mapper.AdminPaymentMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints admin para gestão de pagamentos.
 */
@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final ListPaymentsUseCase listPaymentsUseCase;
    private final GetPaymentDetailsUseCase getPaymentDetailsUseCase;
    private final UpdatePaymentStatusUseCase updatePaymentStatusUseCase;
    private final GetFinancialSummaryUseCase getFinancialSummaryUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminPaymentResponse>>> listPayments(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));

        PaymentStatus statusFilter = (status != null && !status.isBlank())
                ? PaymentStatus.valueOf(status.toUpperCase())
                : null;

        var result = listPaymentsUseCase.execute(statusFilter, pageable);
        var mapped = result.map(AdminPaymentMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<FinancialSummaryResponse>> getFinancialSummary() {
        var summary = getFinancialSummaryUseCase.execute();

        return ResponseEntity.ok(ApiResponse.success(AdminPaymentMapper.toSummaryResponse(summary)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminPaymentResponse>> getPaymentDetails(@PathVariable UUID id) {
        var payment = getPaymentDetailsUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(AdminPaymentMapper.toResponse(payment)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminPaymentResponse>> updatePaymentStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePaymentStatusRequest request
    ) {
        PaymentStatus newStatus = PaymentStatus.valueOf(request.status().toUpperCase());
        var payment = updatePaymentStatusUseCase.execute(id, newStatus);

        return ResponseEntity.ok(ApiResponse.success(AdminPaymentMapper.toResponse(payment)));
    }
}
