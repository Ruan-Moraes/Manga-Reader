package com.toonlira.translationgateway.domain.layout;

import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.stream.IntStream;
import static org.assertj.core.api.Assertions.*;

class BubbleDeduplicatorTest {
    @Test void exactDuplicatesKeepTheOriginalWinnerAndAuditTheLoser() {
        var winner = bubble("winner", 0, 1, .9);
        var loser = bubble("loser", 0, 1, .8);
        var result = BubbleDeduplicator.filter(List.of(loser, winner));
        assertThat(result.retained()).containsExactly(winner);
        assertThat(result.suppressed()).containsExactly(new BubbleDeduplicator.Suppression(loser, "winner", 1, "near-duplicate"));
    }

    @Test void inclusiveThresholdDoesNotSwallowNearbyOrNestedDistinctBalloons() {
        var winner = bubble("a", 0, 1, .9);
        assertThat(BubbleDeduplicator.filter(List.of(winner, bubble("b", 0, .95, .8))).suppressed()).hasSize(1);
        assertThat(BubbleDeduplicator.filter(List.of(winner, bubble("b", 0, .949, .8))).retained()).hasSize(2);
        assertThat(BubbleDeduplicator.filter(List.of(winner, bubble("b", .1, .9, .8))).retained()).hasSize(2);
        assertThat(BubbleDeduplicator.filter(List.of(bubble("a", 0, .4, .9), bubble("b", .4, .8, .8))).retained()).hasSize(2);
    }

    @Test void suppressionIsNotTransitive() {
        var a = bubble("a", 0, .8, .9);
        var b = bubble("b", .02, .82, .8);
        var c = bubble("c", .04, .84, .7);
        var result = BubbleDeduplicator.filter(List.of(c, b, a));
        assertThat(result.retained()).containsExactly(a, c);
        assertThat(result.suppressed()).extracting(s -> s.bubble().id()).containsExactly("b");
    }

    @Test void tiesAndInputPermutationsAreDeterministic() {
        var a = bubble("a", 0, .8, .9);
        var b = bubble("b", 0, .8, .9);
        var c = bubble("c", .01, .81, .9);
        var expected = BubbleDeduplicator.filter(List.of(a, b, c));
        assertThat(expected.retained()).containsExactly(a);
        assertThat(BubbleDeduplicator.filter(List.of(c, a, b))).isEqualTo(expected);
        assertThat(BubbleDeduplicator.filter(List.of(b, c, a))).isEqualTo(expected);
    }

    @Test void rawLimitAndInvalidCandidatesCannotBeHiddenBySuppression() {
        assertThatThrownBy(() -> BubbleDeduplicator.filter(IntStream.range(0, 257)
            .mapToObj(i -> bubble("b" + i, 0, 1, .9)).toList())).hasMessage("layout-limit-exceeded");
        var valid = bubble("b", 0, 1, .9);
        assertThatThrownBy(() -> BubbleDeduplicator.filter(List.of(valid, valid))).hasMessage("layout-invalid-response");
        for (double score : new double[]{Double.NaN, Double.POSITIVE_INFINITY, .49, 1.01})
            assertThatThrownBy(() -> BubbleDeduplicator.filter(List.of(valid, bubble("invalid", 0, 1, score))))
                .hasMessage("layout-invalid-response");
        assertThatThrownBy(() -> BubbleDeduplicator.filter(List.of(new Bubble("", null, .9))))
            .hasMessage("layout-invalid-response");
    }

    private Bubble bubble(String id, double left, double right, double confidence) {
        return new Bubble(id, new LayoutBox(left, 0, right, 1), confidence);
    }
}
