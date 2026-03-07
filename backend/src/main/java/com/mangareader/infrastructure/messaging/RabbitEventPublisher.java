package com.mangareader.infrastructure.messaging;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.shared.config.RabbitMQConfig;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Publica eventos de domínio no RabbitMQ via exchange {@code manga.events}.
 */
@Service
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class RabbitEventPublisher implements EventPublisherPort {

    private final RabbitTemplate rabbitTemplate;

    @Override
    public void publish(String routingKey, Object event) {
        log.debug("Publishing event [{}]: {}", routingKey, event);
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, routingKey, event);
    }
}
