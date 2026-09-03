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

import com.mangareader.reconciler.infrastructure.crossdb.OrphanTitleRefReconciler;
import com.mangareader.reconciler.infrastructure.mongo.ForumReplyCountReconciler;
import com.mangareader.reconciler.infrastructure.mongo.VoteCounterReconciler;
import com.mangareader.reconciler.infrastructure.postgres.PostgresCounterReconciler;

@ExtendWith(MockitoExtension.class)
@DisplayName("CounterReconciliationJob")
class CounterReconciliationJobTest {
    @Mock private PostgresCounterReconciler postgresReconciler;
    @Mock private ForumReplyCountReconciler forumReplyReconciler;
    @Mock private VoteCounterReconciler voteReconciler;
    @Mock private OrphanTitleRefReconciler orphanReconciler;
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

    @Test
    @DisplayName("reconcileOrphans repassa o resultado e reconcilia total_titles quando há obras removidas")
    void reconcileOrphansReconciliaContadorQuandoRemoveObras() {
        Map<String, Integer> removed = Map.of(
                "user_libraries", 1, "group_works", 2, "store_titles", 0,
                "title_authors", 0, "title_publishers", 0);
        when(orphanReconciler.reconcile()).thenReturn(removed);

        Map<String, Integer> result = job.reconcileOrphans();

        assertThat(result).isEqualTo(removed);
        org.mockito.Mockito.verify(postgresReconciler).reconcileTotalTitles();
    }

    @Test
    @DisplayName("reconcileOrphans não toca total_titles quando não removeu obras de grupo")
    void reconcileOrphansNaoTocaContadorSemObras() {
        Map<String, Integer> removed = Map.of(
                "user_libraries", 3, "group_works", 0, "store_titles", 1,
                "title_authors", 0, "title_publishers", 0);
        when(orphanReconciler.reconcile()).thenReturn(removed);

        job.reconcileOrphans();

        org.mockito.Mockito.verifyNoInteractions(postgresReconciler);
    }
}
