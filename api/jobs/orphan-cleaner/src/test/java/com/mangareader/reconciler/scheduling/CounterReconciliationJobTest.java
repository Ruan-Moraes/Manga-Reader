package com.mangareader.reconciler.scheduling;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.reconciler.infrastructure.mongo.ForumReplyCountReconciler;
import com.mangareader.reconciler.infrastructure.mongo.VoteCounterReconciler;
import com.mangareader.reconciler.infrastructure.postgres.PostgresCounterReconciler;

@ExtendWith(MockitoExtension.class)
@DisplayName("CounterReconciliationJob")
class CounterReconciliationJobTest {
    @Mock private PostgresCounterReconciler postgresReconciler;
    @Mock private ForumReplyCountReconciler forumReplyReconciler;
    @Mock private VoteCounterReconciler voteReconciler;
    @InjectMocks private CounterReconciliationJob job;

    @Test
    @DisplayName("Deve agregar os contadores de cada fonte no relatório")
    void deveAgregarContadores() {
        when(postgresReconciler.reconcileTotalTitles()).thenReturn(2);
        when(postgresReconciler.reconcileParticipants()).thenReturn(5);
        when(forumReplyReconciler.reconcile()).thenReturn(7L);
        Map<String, Long> votes = Map.of("comments", 3L, "reviews", 1L, "forum_topics", 4L);
        when(voteReconciler.reconcileAll()).thenReturn(votes);

        ReconciliationReport report = job.reconcile();

        assertThat(report.groups()).isEqualTo(2);
        assertThat(report.events()).isEqualTo(5);
        assertThat(report.forumReplies()).isEqualTo(7L);
        assertThat(report.votes()).isEqualTo(votes);
    }
}
