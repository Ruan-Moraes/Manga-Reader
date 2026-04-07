package com.mangareader.infrastructure.messaging;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.mangareader.application.shared.port.EventPublisherPort;

import lombok.extern.slf4j.Slf4j;

/**
 * Implementação no-op do {@link EventPublisherPort} para o profile "test".
 * <p>
 * Garante que os use cases que dependem do publisher continuem funcionando
 * em testes sem precisar de RabbitMQ.
 */
@Service
@Profile("test")
@Slf4j
public class NoopEventPublisher implements EventPublisherPort {
    @Override
    public void publish(String routingKey, Object event) {
        log.debug("Noop event [{}]: {}", routingKey, event);
    }
}
