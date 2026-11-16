package com.toonlira.translationgateway.infrastructure.ocr;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ClasspathLexiconsTest {
    @Test
    void englishKnowsItsWordsAndItsComicSounds() {
        var english = new ClasspathLexicons().forLanguage("en");
        assertThat(english.available()).isTrue();
        assertThat(english.knows("indeed")).isTrue();
        assertThat(english.isSound("shuffle")).isTrue();
        assertThat(english.isSound("pooof")).isTrue();   // stretched
        assertThat(english.isSound("beeeep")).isTrue();
        assertThat(english.isSound("indeed")).isFalse();
        assertThat(english.isSound("stop")).isFalse();
        assertThat(english.isSound("clickty-tap-clack-key")).isTrue(); // chain of sounds
        assertThat(english.isSound("well-known")).isFalse();
        assertThat(english.isSound("sigh")).isTrue();
        // Languages without a sound list still load their words.
        var spanish = new ClasspathLexicons().forLanguage("es");
        assertThat(spanish.available()).isTrue();
        assertThat(spanish.isSound("shuffle")).isFalse();
    }
}
