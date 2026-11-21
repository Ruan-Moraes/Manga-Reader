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
        assertThat(english.list(com.toonlira.translationgateway.domain.ocr.Lexicon.CLAUSE_OPENERS)).contains("then", "so", "but");
        assertThat(english.list(com.toonlira.translationgateway.domain.ocr.Lexicon.ALTERNATIVES)).contains("and", "or");
        // A language without a word list still loads its own lists.
        var japanese = new ClasspathLexicons().forLanguage("ja");
        assertThat(japanese.available()).isFalse();
        assertThat(japanese.list(com.toonlira.translationgateway.domain.ocr.Lexicon.PARTICLES)).contains("の", "か");
        // Languages without a sound list still load their words.
        var spanish = new ClasspathLexicons().forLanguage("es");
        assertThat(spanish.available()).isTrue();
        assertThat(spanish.isSound("shuffle")).isFalse();
        assertThat(spanish.isSound("zas")).isTrue();
        assertThat(spanish.isSound("hola")).isFalse();
        var portuguese = new ClasspathLexicons().forLanguage("pt-BR");
        assertThat(portuguese.isSound("tchibum")).isTrue();
        assertThat(portuguese.isSound("obrigado")).isFalse();
        var korean = new ClasspathLexicons().forLanguage("ko");
        assertThat(korean.available()).isFalse(); // no word list, only its sounds
        assertThat(korean.isSound("쾅")).isTrue();
        assertThat(korean.isSound("두근두근")).isTrue();
        assertThat(korean.isSound("안녕")).isFalse();
    }
}
