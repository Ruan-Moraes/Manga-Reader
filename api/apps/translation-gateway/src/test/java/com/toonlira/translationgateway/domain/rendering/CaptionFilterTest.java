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
    void handDrawnShoutsAreLetteringWhileSoundEffectsAndShortWordsAreNot() {
        assertThat(CaptionFilter.isLettering("ターミナルがあれば全てが上手くいく", "Com um terminal, tudo dá certo", Lexicon.NONE)).isTrue();
        assertThat(CaptionFilter.isLettering("わんのかゴラァ", "Tá querendo briga?", Lexicon.NONE)).isFalse(); // kana only, short
        assertThat(CaptionFilter.isLettering("全然", "De jeito nenhum", Lexicon.NONE)).isFalse(); // too short
        assertThat(CaptionFilter.isLettering("カタカタカタカタカタカタ", "Tec tec", Lexicon.NONE)).isFalse(); // repeated
        assertThat(CaptionFilter.isLettering("Now Akane... Fine then!! Ubunchu it is...", "Olha, Akane...", EN)).isTrue();
        assertThat(CaptionFilter.isLettering("-clatter clatter", "-clac-clac", EN)).isFalse();
        // Policy: drawn phrases are retyped from two words; onomatopoeia keeps its drawing.
        var words = new Lexicon(Set.of("the", "beast", "click", "finish", "no", "beep", "swish"));
        assertThat(CaptionFilter.isLettering("The Beast!", "A Fera!", words)).isTrue();
        assertThat(CaptionFilter.isLettering("CLICK FINISH?", "CLICAR EM CONCLUIR?", words)).isTrue();
        assertThat(CaptionFilter.isLettering("BEEP", "BIP", words)).isFalse(); // one word
        assertThat(CaptionFilter.isLettering("Swish Swish", "Vush vush", words)).isFalse(); // repeated
        assertThat(CaptionFilter.isLettering("Clickty-tap-clack-key", "Clique-tec", words)).isFalse(); // one token, not a word
        var shouts = new Lexicon(Set.of("owl", "ow", "ha", "haha", "no", "youtube"));
        assertThat(CaptionFilter.isLettering("owl OW!", "coruja AI!", shouts)).isFalse(); // one shout read twice
        assertThat(CaptionFilter.isLettering("Ha Haha!", "Rá rárá!", shouts)).isFalse();
        assertThat(CaptionFilter.isLettering("No Youtube!", "Nada de YouTube!", shouts)).isTrue();
        // Only regions the detector does not see as text become lettering.
        var request = request("Thank you for finally calling it", "Obrigado por finalmente chamar");
        var id = request.regions().getFirst().id();
        assertThat(CaptionFilter.letterings(request, EN, java.util.Map.of(id, "unknown"))).containsExactly(id);
        assertThat(CaptionFilter.letterings(request, EN, java.util.Map.of(id, "text_free"))).isEmpty();
        // On a Japanese page, text written mostly in Latin letters is screen text, not a drawn phrase.
        var screen = request("ja", "Ubuntu Linux Desktop は", "Desktop do Ubuntu Linux");
        var screenId = screen.regions().getFirst().id();
        assertThat(CaptionFilter.letterings(screen, new Lexicon(Set.of("ubuntu", "linux", "desktop")),
            java.util.Map.of(screenId, "unknown"))).isEmpty();
    }

    @Test
    void drawnTextOutsideBalloonsKeepsItsDrawingUnlessItIsASentence() {
        // The helper's region sits at (.1–.5, .1–.2).
        var sign = request("bin", "lixeira");
        var id = sign.regions().getFirst().id();
        var unknown = java.util.Map.of(id, "unknown");
        assertThat(CaptionFilter.drawn(sign, EN, unknown)).containsExactly(id);
        assertThat(CaptionFilter.drawn(sign, EN, java.util.Map.of(id, "text_free"))).isEmpty();
        // Missed by the detector but inside a balloon: speech, not drawn text.
        var balloon = sign.withBubbles(java.util.List.of(new com.toonlira.translationgateway.domain.layout.LayoutBox(0, 0, .6, .3)));
        assertThat(CaptionFilter.drawn(balloon, EN, unknown)).isEmpty();
        // A drawn sentence is lettering, retyped: not kept.
        var shout = request("Thank you for finally calling it", "Obrigado por finalmente chamar");
        assertThat(CaptionFilter.drawn(shout, EN, java.util.Map.of(shout.regions().getFirst().id(), "unknown"))).isEmpty();
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

    private static RenderRequest request(String source, String translated) { return request("en", source, translated); }

    private static RenderRequest request(String language, String source, String translated) {
        var job = java.util.UUID.randomUUID();
        var id = java.util.UUID.randomUUID();
        var pair = new com.toonlira.translationgateway.domain.translation.LanguagePair(language, "pt-BR");
        var polygon = java.util.List.of(new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.1, .1),
            new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.5, .1), new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.5, .2),
            new com.toonlira.translationgateway.domain.OcrManifest.Vertex(.1, .2));
        var ocr = new com.toonlira.translationgateway.domain.OcrManifest("1.0", job, language, 100, 100,
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
