package com.mangareader.application.analytics.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.analytics.port.BehaviorEventRepositoryPort;
import com.mangareader.domain.analytics.entity.BehaviorEventType;
import com.mangareader.domain.analytics.entity.BehaviorPlatform;
import com.mangareader.shared.config.BehaviorAnalyticsProperties;

@ExtendWith(MockitoExtension.class)
class IngestBehaviorEventsUseCaseTest {
    @Mock CanCollectBehaviorAnalyticsUseCase canCollectBehaviorAnalytics;
    @Mock BehaviorEventRepositoryPort repository;
    @Mock BehaviorAnalyticsProperties properties;
    @InjectMocks IngestBehaviorEventsUseCase useCase;

    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        lenient().when(properties.retentionDays()).thenReturn(180L);
        lenient().when(properties.maxBatchSize()).thenReturn(100);
        lenient().when(canCollectBehaviorAnalytics.execute(userId)).thenReturn(true);
    }

    @Test
    void persistsValidAuthenticatedBatch() {
        int accepted = useCase.execute(userId, List.of(validInput()));

        assertThat(accepted).isEqualTo(1);
        verify(repository).insertIgnoringDuplicates(anyList());
    }

    @Test
    void ignoresBatchWhenAnalyticsIsDisabled() {
        when(canCollectBehaviorAnalytics.execute(userId)).thenReturn(false);

        assertThat(useCase.execute(userId, List.of(validInput()))).isZero();
        verify(repository, never()).insertIgnoringDuplicates(anyList());
    }

    @Test
    void rejectsInvalidProgress() {
        var invalid = new IngestBehaviorEventsUseCase.EventInput(UUID.randomUUID().toString(),
                BehaviorEventType.CHAPTER_PROGRESS_CHECKPOINT, UUID.randomUUID().toString(), Instant.now(),
                BehaviorPlatform.WEB, "test", "READER", "title", "1", null, 101, null, null, null);

        assertThatThrownBy(() -> useCase.execute(userId, List.of(invalid)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private IngestBehaviorEventsUseCase.EventInput validInput() {
        return new IngestBehaviorEventsUseCase.EventInput(UUID.randomUUID().toString(),
                BehaviorEventType.TITLE_VIEW_QUALIFIED, UUID.randomUUID().toString(), Instant.now(),
                BehaviorPlatform.WEB, "test", "DIRECT", "title", null, 15_000L, null, null, null, null);
    }
}
