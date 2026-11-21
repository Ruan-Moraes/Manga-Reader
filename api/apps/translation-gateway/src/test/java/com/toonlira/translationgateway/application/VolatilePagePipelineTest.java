package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ChapterMemoryRepository;
import com.toonlira.translationgateway.application.port.LayoutPort;
import com.toonlira.translationgateway.application.port.LexiconPort;
import com.toonlira.translationgateway.application.port.PageDecoderPort;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.application.port.TranslationRefinerPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.ocr.Lexicon;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import tools.jackson.databind.ObjectMapper;

/** The stored pipeline's page stages, now in memory (VolatilePagePipeline): what each one hands the next. */
class VolatilePagePipelineTest {
    private static final Instant NOW = Instant.parse("2026-11-21T12:00:00Z");
    private static final LanguagePair PAIR = new LanguagePair("en", "pt-BR");

    private static VolatilePagePipeline pipeline(GatewayProperties properties, TranslationRefinerPort refiner, ChapterMemoryRepository memory) {
        var beans = new StaticListableBeanFactory();
        if (refiner != null) beans.addBean("refiner", refiner);
        if (memory != null) beans.addBean("memory", memory);
        beans.addBean("lexicons", (LexiconPort) language -> Lexicon.NONE);
        return new VolatilePagePipeline(properties, beans.getBeanProvider(LayoutPort.class),
            beans.getBeanProvider(OcrRereadService.class), beans.getBeanProvider(LexiconPort.class),
            beans.getBeanProvider(PageDecoderPort.class), beans.getBeanProvider(TranslationRefinerPort.class),
            beans.getBeanProvider(ChapterMemoryRepository.class), new ObjectMapper(), Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private static OcrManifest.Region region(int order, String text) {
        return new OcrManifest.Region(UUID.randomUUID(), order, text, List.of(new OcrManifest.Vertex(.1, .1 + order * .2),
            new OcrManifest.Vertex(.4, .1 + order * .2), new OcrManifest.Vertex(.4, .2 + order * .2), new OcrManifest.Vertex(.1, .2 + order * .2)));
    }

    private static TranslationPort translating(String target) {
        var provider = mock(TranslationPort.class);
        when(provider.translate(any())).thenAnswer(call -> new TranslationResponse(((TranslationRequest) call.getArgument(0))
            .regions().stream().map(region -> new TranslationResponse.Region(region.id(), target)).toList()));
        when(provider.translate(any(), any())).thenAnswer(call -> new TranslationResponse(((TranslationRequest) call.getArgument(0))
            .regions().stream().map(region -> new TranslationResponse.Region(region.id(), target)).toList()));
        return provider;
    }

    @Test
    void theReviewLearnsEachRegionsKindOnlyFromThisPagesLayout() {
        var balloon = region(0, "Hello");
        var drawn = region(1, "WHAT");
        var image = "c".repeat(64);
        var ocrSha = "a".repeat(64);
        var json = """
            {"imageSha256":"%s","ocrManifestSha256":"%s","bubbles":[],
             "regionKinds":[{"regionId":"%s","kind":"text_bubble"},{"regionId":"%s","kind":"unknown"}]}"""
            .formatted(image, ocrSha, balloon.id(), drawn.id()).getBytes(java.nio.charset.StandardCharsets.UTF_8);
        var seen = new ArrayList<String>();
        TranslationRefinerPort refiner = (request, translated) -> {
            request.regions().forEach(region -> seen.add(region.kind()));
            return translated;
        };
        var pipeline = pipeline(new GatewayProperties(), refiner, null);
        // This page's layout: the kinds reach the review. Another page's (or none): no kinds.
        for (var hints : List.of(LayoutHints.of(json, image, ocrSha), LayoutHints.of(json, image, "d".repeat(64)), LayoutHints.NONE)) {
            seen.clear();
            pipeline.translate(translating("alvo"), new ChapterMemoryService.Chapter(null, null),
                VolatilePagePipeline.request(UUID.randomUUID(), PAIR, List.of(balloon, drawn), hints));
            if (hints.kinds().isEmpty()) assertThat(seen).containsExactly(null, null);
            else assertThat(seen).containsExactly("text_bubble", "unknown");
        }
    }

    @Test
    void aChapterPageSendsItsGlossaryToTheReviewAndLearnsTheNamesTheReviewUsed() {
        var installation = UUID.randomUUID();
        var context = UUID.randomUUID();
        var memory = mock(ChapterMemoryRepository.class);
        when(memory.find(any(), any(), any(), any())).thenReturn(Map.of("Basil", "Manjericão"));
        var glossaries = new ArrayList<Map<String, String>>();
        var refiner = new TranslationRefinerPort() {
            @Override public TranslationResponse refine(TranslationRequest request, TranslationResponse translated) { return translated; }
            @Override public Review refine(TranslationRequest request, TranslationResponse translated, Map<String, String> glossary) {
                glossaries.add(glossary);
                return new Review(new TranslationResponse(List.of(
                    new TranslationResponse.Region(translated.regions().getFirst().id(), "revisado"))), Map.of("Mint", "Menta"));
            }
        };
        var properties = new GatewayProperties();
        var page = pipeline(properties, refiner, memory).translate(translating("alvo"), new ChapterMemoryService.Chapter(installation, context),
            VolatilePagePipeline.request(UUID.randomUUID(), PAIR, List.of(region(0, "Mint grows here")), LayoutHints.NONE));

        assertThat(page.response().regions()).extracting(TranslationResponse.Region::translatedText).containsExactly("revisado");
        // The result hands back only the names this page used: the review's "Mint", not the chapter's "Basil".
        assertThat(page.terms()).extracting(term -> term.source() + "=" + term.target()).containsExactly("Mint=Menta");
        assertThat(glossaries).containsExactly(Map.of("Basil", "Manjericão"));
        verify(memory).remember(eq(installation), eq(context), any(), eq(Map.of("Mint", "Menta")), any(), eq(NOW),
            eq(NOW.plusSeconds(properties.getDisclosure().getResultRetentionSeconds())));
    }

    @Test
    void withoutAChapterNothingIsRememberedAndTheReviewIsTheStoredPipelinesOne() {
        var memory = mock(ChapterMemoryRepository.class);
        TranslationRefinerPort refiner = (request, translated) -> new TranslationResponse(translated.regions().stream()
            .map(region -> new TranslationResponse.Region(region.id(), "revisado")).toList());
        var page = pipeline(new GatewayProperties(), refiner, memory).translate(translating("alvo"), new ChapterMemoryService.Chapter(null, null),
            VolatilePagePipeline.request(UUID.randomUUID(), PAIR, List.of(region(0, "Hello")), LayoutHints.NONE));
        assertThat(page.response().regions()).extracting(TranslationResponse.Region::translatedText).containsExactly("revisado");
        assertThat(page.terms()).isEmpty();
        verify(memory, never()).remember(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void aReviewThatFailsKeepsTheMachineTranslation() {
        TranslationRefinerPort refiner = (request, translated) -> { throw new IllegalStateException("deadline exceeded"); };
        var page = pipeline(new GatewayProperties(), refiner, null).translate(translating("alvo"), new ChapterMemoryService.Chapter(null, null),
            VolatilePagePipeline.request(UUID.randomUUID(), PAIR, List.of(region(0, "Hello")), LayoutHints.NONE));
        assertThat(page.response().regions()).extracting(TranslationResponse.Region::translatedText).containsExactly("alvo");
    }

    @Test
    void anUndecodedPageSkipsAnalysisAndHasNoLayoutHints() {
        var pipeline = VolatilePagePipeline.plain(new GatewayProperties());
        assertThat(pipeline.decode(new byte[]{'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P'})).isNull();
        assertThat(pipeline.layout(null, new OcrManifest("1.0", UUID.randomUUID(), "en", 10, 10, List.of()), "a".repeat(64), "b".repeat(64), null))
            .isEqualTo(LayoutHints.NONE);
    }
}
