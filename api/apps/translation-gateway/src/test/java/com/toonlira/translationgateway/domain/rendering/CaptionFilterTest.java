package com.toonlira.translationgateway.domain.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.domain.ocr.Lexicon;
import java.util.Set;
import org.junit.jupiter.api.Test;

class CaptionFilterTest {
    private static final Lexicon EN = new Lexicon(Set.of("thank", "you", "for", "finally", "calling", "it", "now", "fine",
        "then", "is", "survey", "summaries", "clatter"));

    @Test
    void speechAndCaptionsAreRetypedSoundEffectsKeepTheirLettering() {
        assertThat(CaptionFilter.isCaption("Thank you for finally calling it Ubuntu!", "Obrigado por finalmente chamá-lo Ubuntu!", EN)).isTrue();
        assertThat(CaptionFilter.isCaption("Now Akane... Fine then!! Ubunchu it is...", "Olha, Akane... Tudo bem!", EN)).isTrue();
        assertThat(CaptionFilter.isCaption("Survey\nSummaries", "Resumos de pesquisas", EN)).isTrue();
        assertThat(CaptionFilter.isCaption("-clatter clatter", "-clac-clac", EN)).isFalse(); // repeated onomatopoeia
        assertThat(CaptionFilter.isCaption("clatter", "barulho", EN)).isFalse(); // single word
        assertThat(CaptionFilter.isCaption("JPTIL(F) ZZRK", "JPTIL(F) ZZRK!", EN)).isFalse(); // non-words
        assertThat(CaptionFilter.isCaption("AKANE!", "akane!", EN)).isFalse(); // unchanged
        assertThat(CaptionFilter.isCaption("ナルト だ", "É o Naruto", Lexicon.NONE)).isTrue(); // no word list: two tokens suffice
    }
}
