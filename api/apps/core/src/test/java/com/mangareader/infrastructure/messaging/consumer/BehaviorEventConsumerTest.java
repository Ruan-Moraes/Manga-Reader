package com.mangareader.infrastructure.messaging.consumer;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.analytics.service.BehaviorEventRecorder.ServerBehaviorEvent;
import com.mangareader.application.analytics.usecase.IngestBehaviorEventsUseCase;
import com.mangareader.domain.analytics.entity.BehaviorEventType;
import com.mangareader.domain.analytics.entity.BehaviorPlatform;

@ExtendWith(MockitoExtension.class)
class BehaviorEventConsumerTest {
    @Mock
    private IngestBehaviorEventsUseCase ingestBehaviorEvents;

    @InjectMocks
    private BehaviorEventConsumer consumer;

    @Test
    void preservesMessageIdAcrossRedelivery() {
        UUID userId = UUID.randomUUID();
        Instant occurredAt = Instant.parse("2026-07-18T10:00:00Z");
        var message = new ServerBehaviorEvent("event-1", userId, BehaviorEventType.LIBRARY_ITEM_ADDED,
                "title-1", null, "LIBRARY", occurredAt);

        consumer.handle(message);

        verify(ingestBehaviorEvents).execute(eq(userId), argThat((List<IngestBehaviorEventsUseCase.EventInput> inputs) -> {
            var input = inputs.getFirst();
            return input.eventId().equals("event-1")
                    && input.sessionId().equals("event-1")
                    && input.dedupeKey().equals("event-1")
                    && input.platform() == BehaviorPlatform.SERVER
                    && input.occurredAt().equals(occurredAt);
        }));
    }
}
