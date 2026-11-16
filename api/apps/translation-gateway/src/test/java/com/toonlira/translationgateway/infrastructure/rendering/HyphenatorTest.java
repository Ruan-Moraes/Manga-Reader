package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HyphenatorTest {
    private static String hyphenated(String language, String word) {
        var out = new StringBuilder();
        int last = 0;
        for (int point : Hyphenator.forLanguage(language).points(word)) { out.append(word, last, point).append('-'); last = point; }
        return out.append(word.substring(last)).toString();
    }

    @Test
    void eachLanguageUsesItsOwnPatternsAndMinimums() {
        // Portuguese keeps 3 letters after the last hyphen (from the language's own file), Spanish 2.
        assertThat(hyphenated("pt-BR", "verdadeiramente")).isEqualTo("ver-da-dei-ra-mente");
        assertThat(hyphenated("es", "verdaderamente")).endsWith("men-te");
        assertThat(hyphenated("pt-BR", "extraordinária")).isEqualTo("ex-tra-or-di-ná-ria");
        assertThat(hyphenated("en", "hyphenation")).isEqualTo("hy-phen-ation");
        assertThat(hyphenated("pt-BR", "SOBRENATURAL")).isEqualTo("SO-BRE-NA-TU-RAL"); // all-caps lettering
    }

    @Test
    void shortWordsNonWordsAndLanguagesWithoutPatternsAreNeverBroken() {
        assertThat(Hyphenator.forLanguage("pt-BR").points("casa")).isEmpty();
        assertThat(Hyphenator.forLanguage("pt-BR").points("abc123def")).isEmpty();
        assertThat(Hyphenator.forLanguage("ja").available()).isFalse();
        assertThat(Hyphenator.forLanguage("ja").points("verdadeiramente")).isEmpty();
    }
}
