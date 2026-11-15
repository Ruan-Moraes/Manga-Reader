package com.toonlira.translationgateway.domain.translation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import java.util.function.Predicate;
import org.junit.jupiter.api.Test;

class TranslationRefinementTest {
    private static final Function<String, List<String>> NO_TERMS = text -> List.of();
    private static final Predicate<String> NOTHING_LOCKED = text -> false;
    private final UUID first = UUID.randomUUID();
    private final UUID second = UUID.randomUUID();

    @Test
    void acceptsACorrectedReadingAndTheTranslationBuiltOnIt() {
        var outcome = merge(List.of("WINDOWS 15 50 PATHETIC", "Hello"), List.of("JANELAS 15 50 PATÉTICO", "Olá"), List.of(
            new TranslationRefinement.Proposal(first, "WINDOWS IS SO PATHETIC", "O WINDOWS É TÃO PATÉTICO"),
            new TranslationRefinement.Proposal(second, null, "Olá")));

        assertThat(texts(outcome)).containsExactly("O WINDOWS É TÃO PATÉTICO", "Olá");
        assertThat(outcome.changed()).isOne();
        assertThat(outcome.correctedSources()).isOne();
        assertThat(outcome.rejected()).isZero();
    }

    @Test
    void rejectsARewrittenReadingButKeepsTheOtherRegionsReview() {
        var outcome = merge(List.of("I'M HUNGRY", "Hello"), List.of("ESTOU COM FOME", "Olá"), List.of(
            new TranslationRefinement.Proposal(first, "LET'S GO TO THE BEACH", "VAMOS À PRAIA"),
            new TranslationRefinement.Proposal(second, null, "Oi")));

        assertThat(texts(outcome)).containsExactly("ESTOU COM FOME", "Oi");
        assertThat(outcome.rejected()).isOne();
    }

    @Test
    void rejectsATranslationThatNoLongerFitsTheBalloon() {
        var outcome = merge(List.of("Wait for me, please", "Hello"), List.of("Espere por mim, por favor", "Olá"), List.of(
            new TranslationRefinement.Proposal(first, null,
                "Espere por mim, por favor, eu imploro, não me deixe aqui sozinho no escuro desta floresta"),
            new TranslationRefinement.Proposal(second, null, "Oi, tudo bem?")));

        assertThat(texts(outcome)).containsExactly("Espere por mim, por favor", "Oi, tudo bem?");
        assertThat(outcome.rejected()).isOne();
    }

    @Test
    void keepsTheMachineTranslationWhenAProtectedLiteralWouldBeLost() {
        Function<String, List<String>> terms = text -> text.contains("Ubuntu") ? List.of("Ubuntu") : List.of();
        var outcome = TranslationRefinement.merge(request(List.of("I use Ubuntu", "Hi")), response(List.of("Eu uso Ubuntu", "Oi")),
            List.of(new TranslationRefinement.Proposal(first, null, "Eu uso Linux"),
                new TranslationRefinement.Proposal(second, null, "Oi")), terms, NOTHING_LOCKED);

        assertThat(texts(outcome)).containsExactly("Eu uso Ubuntu", "Oi");
        assertThat(outcome.rejected()).isOne();
    }

    @Test
    void neverTouchesRegionsTheMachineTranslationKeptVerbatim() {
        var outcome = TranslationRefinement.merge(request(List.of("100%", "Hi")), response(List.of("100%", "Oi")),
            List.of(new TranslationRefinement.Proposal(first, null, "cem por cento"),
                new TranslationRefinement.Proposal(second, null, "Oi")), NO_TERMS, text -> text.equals("100%"));

        assertThat(texts(outcome)).containsExactly("100%", "Oi");
    }

    @Test
    void rejectsAReplyThatMergesDropsOrInventsRegions() {
        var request = request(List.of("Hello", "world"));
        var response = response(List.of("Olá", "mundo"));
        var dropped = List.of(new TranslationRefinement.Proposal(first, null, "Olá, mundo"));
        var duplicated = List.of(new TranslationRefinement.Proposal(first, null, "Olá"),
            new TranslationRefinement.Proposal(first, null, "mundo"));
        var invented = List.of(new TranslationRefinement.Proposal(first, null, "Olá"),
            new TranslationRefinement.Proposal(UUID.randomUUID(), null, "mundo"));

        for (var proposals : List.of(dropped, duplicated, invented)) {
            assertThatThrownBy(() -> TranslationRefinement.merge(request, response, proposals, NO_TERMS, NOTHING_LOCKED))
                .isInstanceOf(TranslationValidationException.class);
        }
    }

    @Test
    void rejectsBlankOrOversizedTranslations() {
        var outcome = merge(List.of("Hello", "world"), List.of("Olá", "mundo"), List.of(
            new TranslationRefinement.Proposal(first, null, "  "),
            new TranslationRefinement.Proposal(second, null, "x".repeat(TranslationLimits.MAX_TRANSLATED_PER_REGION + 1))));

        assertThat(texts(outcome)).containsExactly("Olá", "mundo");
        assertThat(outcome.rejected()).isEqualTo(2);
    }

    @Test
    void measuresEditDistance() {
        assertThat(TranslationRefinement.editDistance("WINDOWS 15 50 PATHETIC", "WINDOWS IS SO PATHETIC")).isEqualTo(4);
        assertThat(TranslationRefinement.editDistance("", "abc")).isEqualTo(3);
        assertThat(TranslationRefinement.editDistance("same", "same")).isZero();
    }

    private TranslationRefinement.Outcome merge(List<String> sources, List<String> machine,
                                                List<TranslationRefinement.Proposal> proposals) {
        return TranslationRefinement.merge(request(sources), response(machine), proposals, NO_TERMS, NOTHING_LOCKED);
    }

    private TranslationRequest request(List<String> sources) {
        return new TranslationRequest(UUID.randomUUID(), new LanguagePair("en", "pt-BR"), List.of(
            new TranslationRequest.Region(first, 0, sources.get(0)), new TranslationRequest.Region(second, 1, sources.get(1))));
    }

    private TranslationResponse response(List<String> machine) {
        return new TranslationResponse(List.of(
            new TranslationResponse.Region(first, machine.get(0)), new TranslationResponse.Region(second, machine.get(1))));
    }

    private static List<String> texts(TranslationRefinement.Outcome outcome) {
        return outcome.response().regions().stream().map(TranslationResponse.Region::translatedText).toList();
    }
}
