package com.mangareader.application.subscription.port;

/**
 * Port de saída — integração com gateway de pagamento externo.
 * <p>
 * O adapter concreto ({@code StripeAdapter}) implementa esta interface.
 * Trocar de gateway exige apenas uma nova implementação, sem alterar use cases.
 */
public interface PaymentGatewayPort {
    /**
     * Cria uma intenção de pagamento no gateway externo.
     *
     * @param amountInCents valor em centavos BRL
     * @param description   descrição legível para o comprovante
     * @param userId        ID do usuário pagador (para rastreabilidade)
     * @return ID externo do pagamento (ex.: PaymentIntent ID do Stripe)
     */
    String createPaymentIntent(long amountInCents, String description, String userId);
}
