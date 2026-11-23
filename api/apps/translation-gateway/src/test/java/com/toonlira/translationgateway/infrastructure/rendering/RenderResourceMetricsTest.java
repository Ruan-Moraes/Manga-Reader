package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RenderResourceMetricsTest {
    @Test void oomCountersAreActualKeyedValuesNotFabricatedZeroes() {
        String counters = "low 0\nhigh 1\nmax 99\noom 3\noom_kill 2\noom_group_kill 0\n";
        assertThat(RenderResourceMetrics.eventCount(counters, "oom_kill")).isEqualTo(2);
        assertThat(RenderResourceMetrics.eventCount(counters, "oom_group_kill")).isZero();
        assertThat(RenderResourceMetrics.eventCount("max 0\n", "oom_kill")).isNull();
        assertThat(RenderResourceMetrics.eventCount(null, "oom_kill")).isNull();
    }

    @Test void malformedAmbiguousUnboundedOrNonAllowlistedCountersRemainUnknown() {
        for (String value : new String[]{"oom_kill -1\n", "oom_kill max\n", "oom_kill 9223372036854775808\n",
                "oom_kill 1\noom_kill 2\n", "oom_kill 0\n oom_kill 2\n", "oom_kill 1 private-data\n", "x".repeat(4097)}) {
            assertThat(RenderResourceMetrics.eventCount(value, "oom_kill")).isNull();
        }
        assertThat(RenderResourceMetrics.eventCount("low 0\n", "low")).isNull();
        assertThat(RenderResourceMetrics.eventCount("oom_kill 1\n", null)).isNull();
    }
}
