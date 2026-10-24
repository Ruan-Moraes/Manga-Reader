package com.toonlira.application.payment.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.payment.port.PaymentRepositoryPort;
import com.toonlira.domain.payment.entity.Payment;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Recupera os detalhes de um pagamento específico (admin).
 */
@Service
@RequiredArgsConstructor
public class GetPaymentDetailsUseCase {
    private final PaymentRepositoryPort paymentRepository;

    @Transactional(readOnly = true)
    public Payment execute(UUID paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
    }
}
