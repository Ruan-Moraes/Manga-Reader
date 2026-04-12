package com.mangareader.application.payment.usecase.admin;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.payment.port.PaymentRepositoryPort;
import com.mangareader.domain.payment.entity.Payment;
import com.mangareader.domain.payment.valueobject.PaymentStatus;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza o status de um pagamento (admin).
 * <p>
 * Quando o novo status é {@code COMPLETED}, registra o {@code paidAt} se ainda não estiver definido.
 */
@Service
@RequiredArgsConstructor
public class UpdatePaymentStatusUseCase {
    private final PaymentRepositoryPort paymentRepository;

    @Transactional
    public Payment execute(UUID paymentId, PaymentStatus newStatus) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        payment.setStatus(newStatus);

        if (newStatus == PaymentStatus.COMPLETED && payment.getPaidAt() == null) {
            payment.setPaidAt(LocalDateTime.now());
        }

        return paymentRepository.save(payment);
    }
}
