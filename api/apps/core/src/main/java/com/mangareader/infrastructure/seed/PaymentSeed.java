package com.mangareader.infrastructure.seed;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.payment.entity.Payment;
import com.mangareader.domain.payment.valueobject.PaymentStatus;
import com.mangareader.infrastructure.persistence.postgres.repository.PaymentJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class PaymentSeed implements EntitySeeder {
    private final PaymentJpaRepository paymentRepository;
    private final UserJpaRepository userRepository;

    @Override
    public int getOrder() {
        return 12;
    }

    @Override
    public void seed() {
        if (paymentRepository.count() > 0) {
            log.info("Pagamentos já existem — seed de payments ignorado.");

            return;
        }

        var users = userRepository.findAll();

        if (users.size() < 4) return;

        var now = LocalDateTime.now();
        var user1 = users.get(0);
        var user2 = users.get(1);
        var user3 = users.get(2);
        var user4 = users.get(3);

        var payments = List.of(
                Payment.builder()
                        .userId(user1.getId())
                        .amount(new BigDecimal("19.90"))
                        .status(PaymentStatus.PENDING)
                        .paymentMethod("PIX")
                        .description("Assinatura Premium mensal")
                        .referenceType("SUBSCRIPTION")
                        .referenceId("sub-1")
                        .build(),
                Payment.builder()
                        .userId(user1.getId())
                        .amount(new BigDecimal("199.00"))
                        .status(PaymentStatus.COMPLETED)
                        .paymentMethod("CREDIT_CARD")
                        .description("Plano anual Premium")
                        .referenceType("SUBSCRIPTION")
                        .referenceId("sub-2")
                        .paidAt(now.minusDays(1))
                        .build(),
                Payment.builder()
                        .userId(user2.getId())
                        .amount(new BigDecimal("49.90"))
                        .status(PaymentStatus.COMPLETED)
                        .paymentMethod("BOLETO")
                        .description("Doação mensal ao site")
                        .referenceType("DONATION")
                        .paidAt(now.minusDays(3))
                        .build(),
                Payment.builder()
                        .userId(user3.getId())
                        .amount(new BigDecimal("5.00"))
                        .currency("USD")
                        .status(PaymentStatus.COMPLETED)
                        .paymentMethod("PAYPAL")
                        .description("Tip ao tradutor")
                        .referenceType("DONATION")
                        .paidAt(now.minusDays(7))
                        .build(),
                Payment.builder()
                        .userId(user1.getId())
                        .amount(new BigDecimal("19.90"))
                        .status(PaymentStatus.FAILED)
                        .paymentMethod("CREDIT_CARD")
                        .description("Renovação automática — cartão recusado")
                        .referenceType("SUBSCRIPTION")
                        .referenceId("sub-1")
                        .build(),
                Payment.builder()
                        .userId(user2.getId())
                        .amount(new BigDecimal("19.90"))
                        .status(PaymentStatus.FAILED)
                        .paymentMethod("PIX")
                        .description("QR Code expirado")
                        .build(),
                Payment.builder()
                        .userId(user3.getId())
                        .amount(new BigDecimal("199.00"))
                        .status(PaymentStatus.REFUNDED)
                        .paymentMethod("CREDIT_CARD")
                        .description("Reembolso solicitado em até 7 dias")
                        .referenceType("SUBSCRIPTION")
                        .referenceId("sub-3")
                        .paidAt(now.minusDays(10))
                        .build(),
                Payment.builder()
                        .userId(user4.getId())
                        .amount(new BigDecimal("999.00"))
                        .status(PaymentStatus.PENDING)
                        .paymentMethod("BOLETO")
                        .description("Pacote vitalício Premium")
                        .referenceType("SUBSCRIPTION")
                        .referenceId("sub-lifetime")
                        .build(),
                Payment.builder()
                        .userId(user1.getId())
                        .amount(new BigDecimal("10.00"))
                        .status(PaymentStatus.COMPLETED)
                        .paidAt(now.minusDays(15))
                        .build(),
                Payment.builder()
                        .userId(user2.getId())
                        .amount(new BigDecimal("9999.99"))
                        .status(PaymentStatus.COMPLETED)
                        .paymentMethod("CREDIT_CARD")
                        .description("Patrocínio anual corporativo")
                        .referenceType("DONATION")
                        .paidAt(now.minusDays(20))
                        .build()
        );

        paymentRepository.saveAll(payments);

        log.info("✓ {} pagamentos de demonstração criados.", payments.size());
    }
}
