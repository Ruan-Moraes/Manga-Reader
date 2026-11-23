package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import java.util.List;
import org.junit.jupiter.api.Test;

class ClaimedObjectCleanupTest {
    private final ObjectStoragePort storage = mock(ObjectStoragePort.class);

    @Test
    void attemptsEveryClaimedKeyEvenAfterMultipleIndependentFailures() {
        doThrow(new IllegalStateException("sensitive object error")).when(storage).delete("first");
        doThrow(new IllegalStateException("raw provider response")).when(storage).delete("second");
        assertThat(ClaimedObjectCleanup.deleteAll(storage, List.of("first", "second", "third"))).isFalse();
        verify(storage).delete("first"); verify(storage).delete("second"); verify(storage).delete("third");
        verifyNoMoreInteractions(storage);
    }

    @Test
    void repeatedSuccessfulDeletesRemainIdempotentWithoutReadingOrCreatingObjects() {
        for (int attempt = 0; attempt < 2; attempt++)
            assertThat(ClaimedObjectCleanup.deleteAll(storage, List.of("owned"))).isTrue();
        verify(storage, times(2)).delete("owned"); verifyNoMoreInteractions(storage);
    }

    @Test
    void emptyClaimNeedsNoStorageOperation() {
        assertThat(ClaimedObjectCleanup.deleteAll(storage, List.of())).isTrue();
        verifyNoMoreInteractions(storage);
    }
}
