package com.mangareader.infrastructure.payment;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.mangareader.application.subscription.port.PaymentGatewayPort;

/**
 * Stub do gateway de pagamento Stripe.
 * <p>
 * Esta implementação simula a criação de um PaymentIntent retornando um ID
 * fictício. Substituir pela integração real com o Stripe SDK quando necessário.
 * <p>
 * Para integração real: adicionar dependência {@code com.stripe:stripe-java}
 * ao pom.xml e implementar a lógica de PaymentIntent via {@code PaymentIntent.create()}.
 */
@Component
public class StripeAdapter implements PaymentGatewayPort {

    private static final Logger log = LoggerFactory.getLogger(StripeAdapter.class);
    private static final String MOCK_ID_PREFIX = "stripe-mock-";

    @Override
    public String createPaymentIntent(long amountInCents, String description, String userId) {
        String mockPaymentId = MOCK_ID_PREFIX + UUID.randomUUID();

        log.info("Stripe stub: criando PaymentIntent para usuário={}, valor={} centavos, desc='{}', mockId={}",
                userId, amountInCents, description, mockPaymentId);

        return mockPaymentId;
    }
}
