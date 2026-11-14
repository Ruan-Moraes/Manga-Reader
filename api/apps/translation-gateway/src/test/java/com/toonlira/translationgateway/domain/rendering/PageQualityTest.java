package com.toonlira.translationgateway.domain.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PageQualityTest {
    private static RenderManifest.Region region(boolean overflow) {
        return new RenderManifest.Region(UUID.randomUUID(), 0, "s", "t", List.of(), overflow, overflow ? 0 : 20);
    }

    @Test
    void fullyRenderedPageIsOk() {
        assertThat(PageQuality.evaluate(List.of(region(false), region(false)))).isEqualTo(new PageQuality("OK", List.of()));
        assertThat(PageQuality.evaluate(List.of()).status()).isEqualTo("OK");
    }

    @Test
    void preservedRegionNeedsReview() {
        var quality = PageQuality.evaluate(List.of(region(false), region(true)));
        assertThat(quality.status()).isEqualTo("NEEDS_REVIEW");
        assertThat(quality.issues()).containsExactly("TEXT_NOT_RENDERED");
    }

    @Test
    void pageWithNothingRenderedIsFlaggedAsSuch() {
        assertThat(PageQuality.evaluate(List.of(region(true))).issues())
            .containsExactly("TEXT_NOT_RENDERED", "ALL_TEXT_NOT_RENDERED");
    }

    @Test
    void unchangedLetteringKeptOnPurposeIsNotAReviewIssue() {
        var name = new RenderManifest.Region(UUID.randomUUID(), 0, "AKANE!\n", " akane! ", List.of(), true, 0);
        assertThat(PageQuality.evaluate(List.of(region(false), name))).isEqualTo(new PageQuality("OK", List.of()));
        assertThat(PageQuality.evaluate(List.of(name, region(true))).issues())
            .containsExactly("TEXT_NOT_RENDERED", "ALL_TEXT_NOT_RENDERED");
    }
}
