package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class LifecycleCleanupAfterCommitTest {
    private final CleanupLifecycleObjectsUseCase cleanup = mock(CleanupLifecycleObjectsUseCase.class);
    private final LifecycleCleanupAfterCommit hook = new LifecycleCleanupAfterCommit(cleanup);

    @AfterEach
    void clearTransaction() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) TransactionSynchronizationManager.clearSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void registersOnlyAnAfterCommitAttempt() {
        begin();
        var id = UUID.randomUUID();
        hook.schedule(id);
        var callbacks = TransactionSynchronizationManager.getSynchronizations();
        assertThat(callbacks).hasSize(1);
        callbacks.getFirst().beforeCommit(false);
        verifyNoInteractions(cleanup);
        callbacks.getFirst().afterCommit();
        verify(cleanup).executeForJob(id);
    }

    @Test
    void rollbackNeverDeletesObjects() {
        begin();
        hook.schedule(UUID.randomUUID());
        TransactionSynchronizationManager.getSynchronizations().getFirst()
            .afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        verifyNoInteractions(cleanup);
    }

    @Test
    void cleanupFailureCannotReplaceTheCommittedOutcome() {
        begin();
        var id = UUID.randomUUID();
        doThrow(new IllegalStateException("sensitive storage detail")).when(cleanup).executeForJob(id);
        hook.schedule(id);
        assertThatCode(() -> TransactionSynchronizationManager.getSynchronizations().getFirst().afterCommit())
            .doesNotThrowAnyException();
    }

    @Test
    void requiresAnActualTransactionAndSynchronization() {
        assertThatThrownBy(() -> hook.schedule(UUID.randomUUID())).isInstanceOf(IllegalStateException.class)
            .hasMessage("Lifecycle cleanup requires a transaction");
        TransactionSynchronizationManager.initSynchronization();
        assertThatThrownBy(() -> hook.schedule(UUID.randomUUID())).isInstanceOf(IllegalStateException.class);
        assertThat(TransactionSynchronizationManager.getSynchronizations()).isEmpty();
        verifyNoInteractions(cleanup);
    }

    @Test
    void nullJobDoesNotRegisterAnAttempt() {
        begin();
        assertThatThrownBy(() -> hook.schedule(null)).isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid lifecycle cleanup job");
        assertThat(TransactionSynchronizationManager.getSynchronizations()).isEmpty();
    }

    private void begin() {
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
    }
}
