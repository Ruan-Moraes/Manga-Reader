package com.toonlira.application.payment.usecase.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.payment.port.PaymentRepositoryPort;
import com.toonlira.domain.payment.entity.Payment;
import com.toonlira.domain.payment.valueobject.PaymentStatus;

import lombok.RequiredArgsConstructor;

/**
 * Lista pagamentos paginados com filtro opcional por status (admin).
 */
@Service
@RequiredArgsConstructor
public class ListPaymentsUseCase {
    private final PaymentRepositoryPort paymentRepository;

    @Transactional(readOnly = true)
    public Page<Payment> execute(PaymentStatus status, Pageable pageable) {
        return status != null
                ? paymentRepository.findByStatus(status, pageable)
                : paymentRepository.findAll(pageable);
    }
}
