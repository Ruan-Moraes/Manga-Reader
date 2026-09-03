package com.mangareader.trending.infrastructure.migration;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;

class TrendingMigrationContractTest {
    @Test
    void changeUnitsDeclareExecutionAndRollbackMethods() throws Exception {
        assertMigrationContract(V001CreateTrendingIndexes.class);
        assertMigrationContract(V002CreateMetricRankingIndexes.class);
    }

    private static void assertMigrationContract(Class<?> type) throws Exception {
        assertThat(type.getDeclaredMethod("execute").isAnnotationPresent(Execution.class)).isTrue();
        assertThat(type.getDeclaredMethod("rollback").isAnnotationPresent(RollbackExecution.class)).isTrue();
    }
}
