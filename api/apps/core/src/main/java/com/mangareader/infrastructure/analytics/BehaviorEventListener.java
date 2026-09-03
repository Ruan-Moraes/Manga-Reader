package com.mangareader.infrastructure.analytics;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.mangareader.application.analytics.service.BehaviorEventRecorder.ServerBehaviorEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.shared.config.RabbitMQConfig;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BehaviorEventListener {
    private final EventPublisherPort eventPublisher;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void handle(ServerBehaviorEvent event) {
        eventPublisher.publish(RabbitMQConfig.ROUTING_KEY_BEHAVIOR_EVENT, event);
    }
}
