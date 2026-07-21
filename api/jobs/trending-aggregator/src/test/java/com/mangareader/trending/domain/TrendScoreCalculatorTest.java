package com.mangareader.trending.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;

class TrendScoreCalculatorTest {
    private final TrendScoreCalculator calculator = new TrendScoreCalculator(.45, .25, .15, .10, .05);
    @Test void balancesAccelerationWithSampleConfidence() {
        var established = calculator.calculate(new TrendMetrics(120, 30, 12, 10, 2), new TrendMetrics(80, 20, 8, 7, 2));
        var tiny = calculator.calculate(new TrendMetrics(2, 0, 0, 0, 0), TrendMetrics.EMPTY);
        assertThat(established.value()).isGreaterThan(tiny.value());
    }
    @Test void reportsDecline() {
        var score = calculator.calculate(new TrendMetrics(5, 1, 0, 0, 0), new TrendMetrics(30, 5, 2, 2, 1));
        assertThat(score.growthPercent()).isNegative();
        assertThat(score.growth().reads()).isNegative();
        assertThat(score.growth().libraryAdds()).isNegative();
    }

    @Test void rejectsNegativeNonFiniteAndUnbalancedWeights() {
        assertThatThrownBy(() -> new TrendScoreCalculator(-.1, .35, .25, .25, .25))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new TrendScoreCalculator(Double.NaN, .25, .25, .25, 0))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new TrendScoreCalculator(.2, .2, .2, .2, .1))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test void reportsZeroGrowthForEmptyPeriodsAndOneHundredPercentForNewSignal() {
        assertThat(calculator.calculate(TrendMetrics.EMPTY, TrendMetrics.EMPTY).growthPercent()).isZero();
        assertThat(calculator.calculate(new TrendMetrics(1, 0, 0, 0, 0), TrendMetrics.EMPTY)
                .growth().reads()).isEqualTo(100);
    }
}
