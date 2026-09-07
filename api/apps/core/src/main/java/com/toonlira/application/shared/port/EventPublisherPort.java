package com.toonlira.application.shared.port;

/**
 * Port para publicação de eventos de domínio.
 * <p>
 * A implementação padrão usa RabbitMQ ({@code RabbitEventPublisher}).
 * Em testes, uma implementação no-op é injetada automaticamente.
 *
 * @see com.toonlira.infrastructure.messaging.RabbitEventPublisher
 * @see com.toonlira.infrastructure.messaging.NoopEventPublisher
 */
public interface EventPublisherPort {
    /**
     * Publica um evento de domínio.
     *
     * @param routingKey chave de roteamento (ex: "rating.submitted", "user.profile.updated")
     * @param event      payload do evento (será serializado em JSON)
     */
    void publish(String routingKey, Object event);
}
