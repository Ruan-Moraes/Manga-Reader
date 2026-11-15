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
        assertThat(CaptionFilter.isCaption("Hola amigo", "Olá, amigo", Lexicon.NONE)).isTrue(); // no word list: two tokens suffice
    }

    @Test
    void japaneseSpeechIsACaptionWithoutSpacesWhileSoundEffectsAreNot() {
        assertThat(CaptionFilter.isCaption("保護してやんねーと世界遺産な意味", "Se não for protegido...", Lexicon.NONE)).isTrue();
        assertThat(CaptionFilter.isCaption("試しにちょっとインスコしてみるだけだかんな", "É só para instalar e testar", Lexicon.NONE)).isTrue();
        assertThat(CaptionFilter.isCaption("インストールしないで", "Não instale", Lexicon.NONE)).isTrue(); // katakana word in a sentence
        assertThat(CaptionFilter.isCaption("カタカタカタカタカタカタナ", "Katakana", Lexicon.NONE)).isFalse(); // repeated unit
        assertThat(CaptionFilter.isCaption("ドキドキ", "Tum-tum", Lexicon.NONE)).isFalse();
        assertThat(CaptionFilter.isCaption("ガチャ", "Clique", Lexicon.NONE)).isFalse(); // short
        assertThat(CaptionFilter.isCaption("わーい", "Eba!", Lexicon.NONE)).isFalse(); // interjection
        assertThat(CaptionFilter.isCaption("うずうず", "Inquieto", Lexicon.NONE)).isFalse();
        assertThat(CaptionFilter.isCaption("ひゅるる", "Fiuuu", Lexicon.NONE)).isFalse(); // short kana sound effect
        assertThat(CaptionFilter.isCaption("※ウブントゥですよ", "※É o Ubuntu.", Lexicon.NONE)).isTrue(); // kana caption
        assertThat(CaptionFilter.isCaption("你好吗朋友", "Tudo bem, amigo?", Lexicon.NONE)).isTrue(); // Chinese
    }

    @Test
    void textTheDetectorDoesNotSeeAsTextIsNeverACaption() {
        // "AKANE IS COMING" reads as a sentence, but the detector classed it as artwork (stylized lettering).
        var request = request("Thank you for finally calling it", "Obrigado por finalmente chamar");
        var id = request.regions().getFirst().id();
        assertThat(CaptionFilter.captions(request, EN, java.util.Map.of())).containsExactly(id);
        assertThat(CaptionFilter.captions(request, EN, java.util.Map.of(id, "text_free"))).containsExactly(id);
        assertThat(CaptionFilter.captions(request, EN, java.util.Map.of(id, "unknown"))).isEmpty();
    }

    private static RenderRequest request(String source, String translated) {
        var job = java.util.UUID.randomUUID();
        var id = java.util.UUID.randomUUID();
        var pair = new com.toonlira.translationgateway.domain.translation.LanguagePair("en", "pt-BR");
        var polygon = java.util.List.of(new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.1, .1),
            new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.5, .1), new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.5, .2),
            new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.1, .2));
        var ocr = new com.toonlira.translationgateway.domain.OcrManifest("1.0", job, "en", 100, 100,
            java.util.List.of(new com.toonlira.translationgateway.domain.OcrManifest.Region(id, 0, source, polygon)));
        var input = new com.toonlira.translationgateway.domain.translation.TranslationRequest(job, pair,
            java.util.List.of(new com.toonlira.translationgateway.domain.translation.TranslationRequest.Region(id, 0, source)));
        var translation = new com.toonlira.translationgateway.domain.translation.TranslationValidator(Set.of(pair)).validateResponse(input,
            new com.toonlira.translationgateway.domain.translation.TranslationResponse(java.util.List.of(
                new com.toonlira.translationgateway.domain.translation.TranslationResponse.Region(id, translated))));
        return RenderRequest.create(new RenderSource("image/png", 100, 100, 100, "a".repeat(64)), ocr, translation,
            "b".repeat(64), "c".repeat(64), RenderPolicy.initial());
    }
}
