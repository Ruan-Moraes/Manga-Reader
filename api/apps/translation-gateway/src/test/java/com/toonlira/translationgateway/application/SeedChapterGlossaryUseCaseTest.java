package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ChapterMemoryRepository;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class SeedChapterGlossaryUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-11-19T12:00:00Z");
    private final ChapterMemoryRepository memory = mock(ChapterMemoryRepository.class);
    private final GatewayProperties properties = new GatewayProperties();
    private final SeedChapterGlossaryUseCase useCase = new SeedChapterGlossaryUseCase(memory, properties, Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void readsTheClientGlossaryInOrder() {
        assertThat(useCase.parse("[{\"source\":\"Coriander\",\"target\":\"Coriander\"},{\"source\":\"コモナ\",\"target\":\"Komona\"}]"))
            .containsExactly(Map.entry("Coriander", "Coriander"), Map.entry("コモナ", "Komona"));
        assertThat(useCase.parse(null)).isEmpty();
        assertThat(useCase.parse("")).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "{}", "[1]", "[{\"source\":\"A\"}]", "[{\"source\":\"A\",\"target\":\"B\",\"extra\":1}]",
        "[{\"source\":\" padded \",\"target\":\"B\"}]", "[{\"source\":\"two\\nlines\",\"target\":\"B\"}]",
        "[{\"source\":\"A\",\"target\":\"B\"},{\"source\":\"A\",\"target\":\"C\"}]", "[not json"})
    void anythingElseIsAMalformedRequest(String glossary) {
        assertThatThrownBy(() -> useCase.parse(glossary)).isInstanceOf(GatewayException.class);
    }

    @Test
    void boundsTheNumberOfEntriesAndTheSize() {
        var many = new StringBuilder("[");
        for (int i = 0; i <= SeedChapterGlossaryUseCase.MAX_ENTRIES; i++) many.append(i == 0 ? "" : ",").append("{\"source\":\"N").append(i).append("\",\"target\":\"T\"}");
        assertThatThrownBy(() -> useCase.parse(many.append("]").toString())).isInstanceOf(GatewayException.class);
        assertThatThrownBy(() -> useCase.parse("[" + " ".repeat(SeedChapterGlossaryUseCase.MAX_CHARS) + "]")).isInstanceOf(GatewayException.class);
    }

    @Test
    void refillsTheChapterMemoryWithTheDisclosedRetentionAndNeverFailsTheSubmission() {
        var installation = UUID.randomUUID();
        var chapter = UUID.randomUUID();
        var terms = Map.of("Coriander", "Coriander");
        useCase.seed(installation, chapter, "en", "pt-BR", terms);
        verify(memory).remember(eq(installation), eq(chapter), eq(new LanguagePair("en", "pt-BR")), eq(terms), eq(terms.keySet()), eq(NOW),
            eq(NOW.plusSeconds(properties.getDisclosure().getResultRetentionSeconds())));

        doThrow(new IllegalStateException("database down")).when(memory).remember(any(), any(), any(), any(), any(), any(), any());
        useCase.seed(installation, chapter, "en", "pt-BR", terms);

        useCase.seed(installation, null, "en", "pt-BR", terms);
        useCase.seed(installation, chapter, "en", "pt-BR", Map.of());
        verify(memory, org.mockito.Mockito.times(2)).remember(any(), any(), any(), any(), any(), any(), any());
        verify(memory, never()).forget(any(), any(), any(), any());
    }
}
