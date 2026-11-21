package com.toonlira.translationgateway.domain.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PageQualityTest {
    private static final int W = 1000, H = 1000;

    private static PageQuality evaluate(List<RenderManifest.Region> regions) { return PageQuality.evaluate(regions, W, H); }

    /** Drawn region of {@code letters} letters in a box of {@code side} px square, at {@code font} px. */
    private static RenderManifest.Region drawn(int letters, int side, int font) {
        double s = side / (double) W;
        var box = List.of(new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.1, .1),
            new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.1 + s, .1),
            new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.1 + s, .1 + s),
            new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.1, .1 + s));
        return new RenderManifest.Region(UUID.randomUUID(), 0, "A".repeat(letters), "b", box, false, font, false);
    }

    @Test
    void textDrawnFarSmallerThanItsLetteringNeedsReview() {
        // 4 letters in a 200 px box: lettering about 100 px. 30 px is under 0.4 of it; 48 px is not.
        var quality = evaluate(List.of(drawn(4, 200, 30), region(false)));
        assertThat(quality).isEqualTo(new PageQuality("NEEDS_REVIEW", List.of("TEXT_TOO_SMALL")));
        assertThat(evaluate(List.of(drawn(4, 200, 48))).status()).isEqualTo("OK");
        // Not drawn at all is TEXT_NOT_RENDERED only, never also too small.
        var missing = new RenderManifest.Region(UUID.randomUUID(), 0, "AAAA", "b", drawn(4, 200, 30).polygon(), true, 0, false);
        assertThat(evaluate(List.of(missing)).issues()).containsExactly("TEXT_NOT_RENDERED", "ALL_TEXT_NOT_RENDERED");
        var counts = RenderTextCounts.of(List.of(drawn(4, 200, 30), missing), W, H);
        assertThat(counts).isEqualTo(new RenderTextCounts(2, 1, 1));
        assertThat(counts.quality().issues()).containsExactly("TEXT_NOT_RENDERED", "TEXT_TOO_SMALL");
        // More small regions than drawn ones is impossible.
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> new RenderTextCounts(2, 1, 2))
            .isInstanceOf(RenderValidationException.class);
    }

    private static RenderManifest.Region region(boolean overflow) {
        return new RenderManifest.Region(UUID.randomUUID(), 0, "s", "t", List.of(), overflow, overflow ? 0 : 20, false);
    }

    @Test
    void fullyRenderedPageIsOk() {
        assertThat(evaluate(List.of(region(false), region(false)))).isEqualTo(new PageQuality("OK", List.of()));
        assertThat(evaluate(List.of()).status()).isEqualTo("OK");
    }

    @Test
    void preservedRegionNeedsReview() {
        var quality = evaluate(List.of(region(false), region(true)));
        assertThat(quality.status()).isEqualTo("NEEDS_REVIEW");
        assertThat(quality.issues()).containsExactly("TEXT_NOT_RENDERED");
    }

    @Test
    void pageWithNothingRenderedIsFlaggedAsSuch() {
        assertThat(evaluate(List.of(region(true))).issues())
            .containsExactly("TEXT_NOT_RENDERED", "ALL_TEXT_NOT_RENDERED");
    }

    @Test
    void unchangedLetteringKeptOnPurposeIsNotAReviewIssue() {
        var name = new RenderManifest.Region(UUID.randomUUID(), 0, "AKANE!\n", " akane! ", List.of(), true, 0, false);
        assertThat(evaluate(List.of(region(false), name))).isEqualTo(new PageQuality("OK", List.of()));
        assertThat(evaluate(List.of(name, region(true))).issues())
            .containsExactly("TEXT_NOT_RENDERED", "ALL_TEXT_NOT_RENDERED");
    }

    @Test
    void drawnTextKeptOnPurposeIsNotAReviewIssue() {
        var sound = new RenderManifest.Region(UUID.randomUUID(), 0, "BEEP", "BIP", List.of(), true, 0, true);
        assertThat(evaluate(List.of(region(false), sound))).isEqualTo(new PageQuality("OK", List.of()));
        assertThat(RenderTextCounts.of(List.of(region(false), sound, region(true)), W, H)).isEqualTo(new RenderTextCounts(2, 1));
    }

    @Test
    void persistedCountsDeriveTheSameQualityAsTheManifest() {
        var regions = List.of(region(false), region(true),
            new RenderManifest.Region(UUID.randomUUID(), 0, "AKANE!", "AKANE!", List.of(), true, 0, false));
        var counts = RenderTextCounts.of(regions, W, H);
        assertThat(counts).isEqualTo(new RenderTextCounts(2, 1));
        assertThat(PageQuality.of(counts)).isEqualTo(evaluate(regions));
        assertThat(new RenderTextCounts(0, 0).quality().status()).isEqualTo("OK");
        assertThat(new RenderTextCounts(3, 3).quality().issues()).containsExactly("TEXT_NOT_RENDERED", "ALL_TEXT_NOT_RENDERED");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> new RenderTextCounts(1, 2))
            .isInstanceOf(RenderValidationException.class);
    }
}
