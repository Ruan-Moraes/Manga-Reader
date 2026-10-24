package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.SupportedLanguages;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class SyntheticWorkerTextTest {
    @ParameterizedTest @ValueSource(strings = {"ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR"})
    void createsExactUtf16LimitShapesWithRealScriptCharactersAndBreaks(String language) {
        for (int length : new int[] {32, 512, 8192}) {
            var text = SyntheticWorkerText.text(language, length);
            assertThat(text).hasSize(length).contains("\n");
            assertThat(text.codePoints().anyMatch(character -> Character.isSurrogate((char) character))).isFalse();
        }
        assertThat(SyntheticWorkerText.text(language, 0)).isEmpty();
        assertThat(SyntheticWorkerText.sourceLanguage(language)).isNotEqualTo(language);
    }

    @Test void keepsChineseVariantsAndPortugueseDistinctWithoutAliases() {
        assertThat(SyntheticWorkerText.languages()).isEqualTo(SupportedLanguages.CODES);
        assertThat(SyntheticWorkerText.text("zh-Hans", 512)).contains("简体", "测试").doesNotContain("繁體");
        assertThat(SyntheticWorkerText.text("zh-Hant", 512)).contains("繁體", "測試").doesNotContain("简体");
        assertThat(SyntheticWorkerText.text("pt-BR", 512)).contains("ação", "café");
        for (var language : new String[] {"zh", "pt", "en-US", "", "private-job-reference"})
            assertThatThrownBy(() -> SyntheticWorkerText.text(language, 32)).hasMessage("synthetic-worker-text-invalid").hasNoCause();
        assertThatThrownBy(() -> SyntheticWorkerText.text(null, 32)).hasMessage("synthetic-worker-text-invalid").hasNoCause();
        for (int length : new int[] {-1, 8193})
            assertThatThrownBy(() -> SyntheticWorkerText.text("ja", length)).hasMessage("synthetic-worker-text-invalid").hasNoCause();
    }
}
