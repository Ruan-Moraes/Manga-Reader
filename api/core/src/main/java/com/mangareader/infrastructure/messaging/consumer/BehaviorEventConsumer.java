package com.mangareader.infrastructure.messaging.consumer;

import java.util.List;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.application.analytics.service.BehaviorEventRecorder.ServerBehaviorEvent;
import com.mangareader.application.analytics.usecase.IngestBehaviorEventsUseCase;
import com.mangareader.application.analytics.usecase.IngestBehaviorEventsUseCase.EventInput;
import com.mangareader.domain.analytics.entity.BehaviorPlatform;
import com.mangareader.shared.config.RabbitMQConfig;

import lombok.RequiredArgsConstructor;

@Component
@Profile("!test")
@RequiredArgsConstructor
public class BehaviorEventConsumer {
    private final IngestBehaviorEventsUseCase ingestBehaviorEvents;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_BEHAVIOR_ANALYTICS,
            containerFactory = "behaviorRabbitListenerContainerFactory")
    public void handle(ServerBehaviorEvent event) {
        var input = new EventInput(event.eventId(), event.type(), event.eventId(), event.occurredAt(),
                BehaviorPlatform.SERVER, "server", event.source(), event.titleId(), event.chapterNumber(),
                null, null, null, null, event.eventId());
        ingestBehaviorEvents.execute(event.userId(), List.of(input));
    }
}
