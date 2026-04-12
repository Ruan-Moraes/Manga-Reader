package com.mangareader.application.payment.usecase.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.payment.port.PaymentRepositoryPort;
import com.mangareader.domain.payment.entity.Payment;
import com.mangareader.domain.payment.valueobject.PaymentStatus;

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
