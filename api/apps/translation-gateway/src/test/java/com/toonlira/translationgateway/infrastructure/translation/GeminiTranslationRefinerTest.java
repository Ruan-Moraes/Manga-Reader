package com.toonlira.translationgateway.infrastructure.translation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class GeminiTranslationRefinerTest {
    private final UUID first = UUID.randomUUID();
    private final UUID second = UUID.randomUUID();
    private final TranslationRequest request = new TranslationRequest(UUID.randomUUID(), new LanguagePair("en", "pt-BR"), List.of(
        new TranslationRequest.Region(first, 0, "WINDOWS 15 50 PATHETIC"),
        new TranslationRequest.Region(second, 1, "I use Ubuntu")));
    private final TranslationResponse machine = new TranslationResponse(List.of(
        new TranslationResponse.Region(first, "JANELAS 15 50 PATÉTICO"),
        new TranslationResponse.Region(second, "Eu uso Ubuntu")));

    @Test
    void sendsOnlyOrdinalIdsAndPageTextThenAppliesTheReview() {
        var calls = new ArrayList<String[]>();
        var refiner = new GeminiTranslationRefiner((system, user) -> {
            calls.add(new String[] {system, user});
            return """
                {"regions":[{"id":"1","source":"WINDOWS IS SO PATHETIC","translation":"O WINDOWS É TÃO PATÉTICO"},
                            {"id":"2","source":null,"translation":"Eu uso o Ubuntu"}]}""";
        }, 12_000);

        var refined = refiner.refine(request, machine);

        assertThat(refined.regions()).extracting(TranslationResponse.Region::id).containsExactly(first, second);
        assertThat(refined.regions()).extracting(TranslationResponse.Region::translatedText)
            .containsExactly("O WINDOWS É TÃO PATÉTICO", "Eu uso o Ubuntu");
        assertThat(calls).hasSize(1);
        assertThat(calls.getFirst()[0]).contains("from en to pt-BR", "Never merge, split").doesNotContain("%s");
        assertThat(calls.getFirst()[1]).contains("\"id\":\"1\"", "\"id\":\"2\"", "WINDOWS 15 50 PATHETIC", "JANELAS 15 50 PATÉTICO")
            .doesNotContain(first.toString(), second.toString());
    }

    @Test
    void keepsAProtectedLiteralEvenWhenTheModelDropsIt() {
        var refiner = new GeminiTranslationRefiner((system, user) -> """
            {"regions":[{"id":"1","translation":"JANELAS 15 50 PATÉTICO"},{"id":"2","translation":"Eu uso Linux"}]}""", 12_000);

        assertThat(refiner.refine(request, machine).regions()).extracting(TranslationResponse.Region::translatedText)
            .containsExactly("JANELAS 15 50 PATÉTICO", "Eu uso Ubuntu");
    }

    @Test
    void malformedOrIncompleteRepliesAreNotAReview() {
        for (var reply : List.of("", "not json", "{\"regions\":{}}", "{\"regions\":[{\"id\":\"1\",\"translation\":\"x\"}]}",
            "{\"regions\":[{\"id\":\"1\",\"translation\":\"x\"},{\"id\":\"3\",\"translation\":\"y\"}]}",
            "{\"regions\":[{\"id\":1,\"translation\":\"x\"},{\"id\":\"2\",\"translation\":\"y\"}]}")) {
            var refiner = new GeminiTranslationRefiner((system, user) -> reply, 12_000);
            assertThatThrownBy(() -> refiner.refine(request, machine)).isInstanceOf(RuntimeException.class);
        }
        var nullReply = new GeminiTranslationRefiner((system, user) -> null, 12_000);
        assertThatThrownBy(() -> nullReply.refine(request, machine)).isInstanceOf(GatewayException.class);
    }

    @Test
    void pagesOverTheCharacterBudgetSkipTheModel() {
        var refiner = new GeminiTranslationRefiner((system, user) -> { throw new AssertionError("model called"); }, 20);

        assertThat(refiner.refine(request, machine)).isSameAs(machine);
    }

    @Test
    void structuredOutputSchemaMatchesWhatTheRefinerParses() {
        var schema = VertexGeminiClient.RESPONSE_SCHEMA.toJson();
        assertThat(schema).contains("\"regions\"", "\"id\"", "\"source\"", "\"translation\"", "\"nullable\":true");
    }
}
