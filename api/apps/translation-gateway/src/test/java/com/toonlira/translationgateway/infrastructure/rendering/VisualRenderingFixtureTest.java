package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.SupportedLanguages;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.util.Arrays;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class VisualRenderingFixtureTest {
    @ParameterizedTest
    @ValueSource(strings = {"ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"})
    void bindsFourSyntheticRegionsInOrderWithoutChangingPolicyOrLanguage(String language) {
        var source = new RenderSource("image/png", 100, VisualRenderingFixture.WIDTH, VisualRenderingFixture.HEIGHT, "a".repeat(64));
        var request = VisualRenderingFixture.request(source, language);
        assertThat(request.pair().target()).isEqualTo(language);
        assertThat(request.pair().source()).isNotEqualTo(language);
        assertThat(request.policy().version()).isEqualTo("clean-box-1.1");
        assertThat(request.regions()).hasSize(4);
        assertThat(request.regions().stream().map(region -> region.readingOrder())).containsExactly(0, 1, 2, 3);
        assertThat(request.regions().get(0).translatedText()).isEqualTo(VisualRenderingFixture.text(language));
        assertThat(request.regions().get(1).translatedText()).contains("\n");
        assertThat(request.regions().get(3).translatedText()).hasSizeLessThanOrEqualTo(8192);
        assertThat(request.regions().get(3).translatedText()).contains(VisualRenderingFixture.text(language));
        assertThatThrownBy(() -> request.regions().clear()).isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void catalogIsDistinctAndBackgroundIsReproducibleWithNoHostFontDependency() {
        assertThat(SupportedLanguages.CODES.stream().map(VisualRenderingFixture::text).distinct()).hasSize(7);
        var first = VisualRenderingFixture.image();
        var second = VisualRenderingFixture.image();
        try {
            assertThat(Arrays.equals(first.getRGB(0, 0, first.getWidth(), first.getHeight(), null, 0, first.getWidth()),
                second.getRGB(0, 0, second.getWidth(), second.getHeight(), null, 0, second.getWidth()))).isTrue();
            assertThat(first).isNotSameAs(second);
        } finally { first.flush(); second.flush(); }
    }

    @Test
    void unknownLanguageIsNeverSilentlyReplacedAndVariantsRemainDistinct() {
        for (var language : new String[] {null, "pt", "zh", "zh-CN", "unknown"})
            assertThatThrownBy(() -> VisualRenderingFixture.text(language)).hasMessage("visual-fixture-invalid");
        assertThat(VisualRenderingFixture.text("zh-Hans")).isNotEqualTo(VisualRenderingFixture.text("zh-Hant"));
    }
}
