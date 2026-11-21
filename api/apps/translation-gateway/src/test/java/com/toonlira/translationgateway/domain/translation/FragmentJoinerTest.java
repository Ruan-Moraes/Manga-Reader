package com.toonlira.translationgateway.domain.translation;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class FragmentJoinerTest {
    private static final UUID JOB = UUID.randomUUID();

    private static TranslationRequest request(String source, String... texts) {
        var regions = new java.util.ArrayList<TranslationRequest.Region>();
        for (int i = 0; i < texts.length; i++) regions.add(new TranslationRequest.Region(new UUID(0, i + 1), i, texts[i]));
        return new TranslationRequest(JOB, new LanguagePair(source, "pt-BR"), regions);
    }

    @Test
    void oneCharacterPerBalloonIsTranslatedAsOneWordAndTheFollowersGetAnEllipsis() {
        var original = request("ja", "大丈夫?", "あ", "ら", "これは何?");
        var joiner = FragmentJoiner.of(original);
        assertThat(joiner.request().regions()).extracting(TranslationRequest.Region::sourceText)
            .containsExactly("大丈夫?", "あら", "これは何?");
        assertThat(joiner.request().regions().get(1).id()).isEqualTo(new UUID(0, 2));
        var response = new TranslationResponse(List.of(new TranslationResponse.Region(new UUID(0, 1), "Tudo bem?"),
            new TranslationResponse.Region(new UUID(0, 2), "Oh!"), new TranslationResponse.Region(new UUID(0, 4), "O que é isso?")));
        var expanded = joiner.expand(response);
        assertThat(expanded.regions()).extracting(TranslationResponse.Region::translatedText)
            .containsExactly("Tudo bem?", "Oh!", "…", "O que é isso?");
        assertThat(expanded.regions().get(2).id()).isEqualTo(new UUID(0, 3));
        // The expanded response validates against the original request.
        var result = new TranslationValidator(java.util.Set.of(original.pair())).validateResponse(original, expanded);
        assertThat(result.regions()).hasSize(4);
    }

    @Test
    void wordsLonelySyllablesApartSpacedScriptsAndPunctuationAreLeftAlone() {
        // Not consecutive in reading order, a lone fragment, real words, digits and punctuation only.
        for (var request : List.of(request("ja", "あ", "大丈夫?", "ら"), request("ja", "あ"), request("ja", "まあね", "うん"),
            request("ja", "1", "2"), request("ja", "!", "?"), request("en", "A", "H"), request("ja", "c", "C"))) {
            assertThat(FragmentJoiner.of(request).request()).isSameAs(request);
        }
        // Runs are capped: four single kana are a run of three and a lone one.
        assertThat(FragmentJoiner.of(request("ja", "あ", "い", "う", "え")).request().regions())
            .extracting(TranslationRequest.Region::sourceText).containsExactly("あいう", "え");
    }
}
