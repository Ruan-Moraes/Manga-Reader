package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.*;
import com.toonlira.translationgateway.domain.*;
import com.toonlira.translationgateway.domain.rendering.*;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

class ProcessVolatilePageUseCaseTest {
    private final GatewayProperties properties = new GatewayProperties();
    private final VolatileAttemptUseCase attempts = mock(VolatileAttemptUseCase.class);
    private final InlineOcrPort ocr = mock(InlineOcrPort.class);
    private final TranslationPort translation = mock(TranslationPort.class);
    private final VolatileRenderPort renderer = mock(VolatileRenderPort.class);
    private final UUID owner = UUID.randomUUID(), key = UUID.randomUUID(), operation = UUID.randomUUID();
    private ProcessVolatilePageUseCase useCase;
    private final AtomicBoolean abandoned = new AtomicBoolean();
    private OcrManifestService ocrManifests;
    private TranslationManifestService translationManifests;
    private byte[] original;

    @BeforeEach void setup() throws Exception {
        properties.setEnabled(true); properties.setVolatileProcessingEnabled(true);
        properties.getDisclosure().setVersion("volatile-1");
        properties.getDisclosure().setOperatorName("Operator");
        properties.getDisclosure().setOperatorContact("privacy@example.test");
        properties.getDisclosure().setPrivacyPolicyUrl("https://example.test/privacy");
        properties.getDisclosure().setTermsUrl("https://example.test/terms");
        properties.getDisclosure().setProviderTrainingPolicy("No training");
        properties.getTranslation().setEnabledPairs(List.of("ja:pt-BR"));
        var mapper = GatewayJsonMapper.create();
        ocrManifests = spy(new OcrManifestService(mapper));
        translationManifests = spy(new TranslationManifestService(mapper));
        configureProviders(provider(ocr), provider(translation), provider(renderer));
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(32, 16, BufferedImage.TYPE_INT_RGB), "png", bytes);
        original = bytes.toByteArray();
    }

    @Test void zeroesOwnedBuffersAfterDeliveryAndSkipsTranslationForEmptyPage() throws Exception {
        accepted();
        var borrowedOriginal = new AtomicReference<byte[]>();
        when(ocr.recognize(any(), eq("ja"), eq(operation), eq(32), eq(16))).thenAnswer(call -> {
            borrowedOriginal.set(call.getArgument(0)); return List.of();
        });
        var encoded = new byte[]{1, 2, 3};
        when(renderer.render(any(), any())).thenAnswer(call -> {
            RenderRequest request = call.getArgument(1);
            return new VolatileRenderPort.Output(encoded, RenderManifest.create(request,
                new RenderedImage("image/webp", 3, 32, 16, InMemoryMedia.sha256(encoded)), List.of()));
        });
        var borrowedManifest = new AtomicReference<byte[]>();
        useCase.execute(owner, key, command(), new ByteArrayInputStream(original), (manifest, image, fence) -> {
            borrowedManifest.set(manifest);
            assertThat(new String(manifest)).contains(operation.toString());
            assertThat(image).containsExactly(1, 2, 3);
        });
        assertThat(borrowedOriginal.get()).containsOnly((byte) 0);
        assertThat(borrowedManifest.get()).containsOnly((byte) 0);
        assertThat(encoded).containsOnly((byte) 0);
        assertThat(original).startsWith((byte) 0x89, (byte) 0x50);
        verifyNoInteractions(translation);
        verify(attempts).finish(operation, VolatileAttemptRepository.Status.FINISHED, null);
    }

    @Test void replayDoesNotReadBodyReserveOrCallProviders() {
        when(attempts.find(owner, key)).thenReturn(Optional.of(new VolatileAttemptRepository.Receipt(operation,
            VolatileAttemptRepository.Status.STARTED, Instant.EPOCH, null, null)));
        var input = mock(java.io.InputStream.class);
        assertThatThrownBy(() -> useCase.execute(owner, key, command(), input, (m, i, fence) -> fail("No delivery")))
            .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.status()).isEqualTo(409));
        verifyNoInteractions(input, ocr, translation, renderer);
        verify(attempts, never()).reserve(any(), any());
    }

    @Test void mismatchedOrOversizedBodyCannotConsumeProviderQuota() {
        var oversized = java.util.Arrays.copyOf(original, original.length + 1);
        assertThatThrownBy(() -> useCase.execute(owner, key, command(), new ByteArrayInputStream(oversized), (m, i, fence) -> { }))
            .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.status()).isEqualTo(413));
        assertThatThrownBy(() -> useCase.execute(owner, key, command(), new ByteArrayInputStream(new byte[4]), (m, i, fence) -> { }))
            .isInstanceOf(GatewayException.class);
        verify(attempts, never()).reserve(any(), any());
        verifyNoInteractions(ocr, translation);
        verify(renderer, never()).render(any(), any());
    }

    @Test void providerFailureIsSanitizedAndCapacityRecovers() throws Exception {
        accepted();
        when(ocr.recognize(any(), anyString(), any(), anyInt(), anyInt()))
            .thenThrow(new IllegalStateException("private-provider-content"));
        for (int attempt = 0; attempt < 2; attempt++) {
            assertThatThrownBy(() -> useCase.execute(owner, key, command(), new ByteArrayInputStream(original), (m, i, fence) -> { }))
                .isInstanceOf(GatewayException.class).hasNoCause().hasMessageNotContaining("private-provider-content");
        }
        verify(ocr, times(2)).recognize(any(), anyString(), any(), anyInt(), anyInt());
        verify(attempts, times(2)).finish(operation, VolatileAttemptRepository.Status.FAILED, "internal-error");
    }

    @Test void disabledGatewayDoesNotReadOrReserve() {
        properties.setVolatileProcessingEnabled(false);
        var input = mock(java.io.InputStream.class);
        assertThatThrownBy(() -> useCase.execute(owner, key, command(), input, (m, i, fence) -> { })).isInstanceOf(GatewayException.class);
        verifyNoInteractions(input, attempts, ocr, translation, renderer);
    }

    @Test void bindsNonemptyOcrTranslationAndRenderInMemoryWithoutLoggingContent() throws Exception {
        accepted();
        var region = new OcrManifest.Region(UUID.randomUUID(), 0, "PRIVATE_SOURCE_TEXT", List.of(
            new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.9, .1), new OcrManifest.Vertex(.9, .9), new OcrManifest.Vertex(.1, .9)));
        when(ocr.recognize(any(), anyString(), any(), anyInt(), anyInt())).thenReturn(List.of(region));
        when(translation.translate(any())).thenAnswer(call -> {
            com.toonlira.translationgateway.domain.translation.TranslationRequest request = call.getArgument(0);
            assertThat(request.jobRef()).isEqualTo(operation);
            assertThat(request.regions().getFirst().sourceText()).isEqualTo(region.sourceText());
            return new com.toonlira.translationgateway.domain.translation.TranslationResponse(List.of(
                new com.toonlira.translationgateway.domain.translation.TranslationResponse.Region(region.id(), "PRIVATE_TRANSLATED_TEXT")));
        });
        when(renderer.render(any(), any())).thenAnswer(call -> {
            RenderRequest request = call.getArgument(1);
            assertThat(request.source().sha256()).isEqualTo(InMemoryMedia.sha256(original));
            assertThat(request.regions().getFirst().translatedText()).isEqualTo("PRIVATE_TRANSLATED_TEXT");
            return new VolatileRenderPort.Output(new byte[]{1}, RenderManifest.create(request,
                new RenderedImage("image/webp", 1, 32, 16, InMemoryMedia.sha256(new byte[]{1})),
                List.of(new RenderManifest.Placement(region.id(), true, 0))));
        });
        var logger = (ch.qos.logback.classic.Logger) org.slf4j.LoggerFactory.getLogger(ProcessVolatilePageUseCase.class);
        var previous = logger.getLevel();
        var appender = new ch.qos.logback.core.read.ListAppender<ch.qos.logback.classic.spi.ILoggingEvent>();
        appender.start(); logger.addAppender(appender); logger.setLevel(ch.qos.logback.classic.Level.INFO);
        try {
        useCase.execute(owner, key, command(), new ByteArrayInputStream(original), (manifest, image, fence) -> {
            var json = GatewayJsonMapper.create().readTree(manifest);
            assertThat(json.path("jobRef").asText()).isEqualTo(operation.toString());
            assertThat(json.path("regions").get(0).path("translatedText").asText()).isEqualTo("PRIVATE_TRANSLATED_TEXT");
        });
            var logs = appender.list.stream().map(ch.qos.logback.classic.spi.ILoggingEvent::getFormattedMessage).collect(java.util.stream.Collectors.joining("\n"));
            assertThat(logs).doesNotContain("PRIVATE_SOURCE_TEXT", "PRIVATE_TRANSLATED_TEXT", key.toString());
            assertThat(logs).contains("event=reserved", "event=produced", "outcome=response-written");
        } finally {
            logger.detachAppender(appender); appender.stop(); logger.setLevel(previous);
        }
        var order = inOrder(attempts, ocr, translation, renderer);
        order.verify(renderer, times(2)).requireAvailable();
        order.verify(attempts).reserve(owner, key);
        order.verify(ocr).recognize(any(), anyString(), eq(operation), eq(32), eq(16));
        order.verify(translation).translate(any());
        order.verify(renderer).render(any(), any());
        order.verify(attempts).finish(operation, VolatileAttemptRepository.Status.FINISHED, null);
    }

    @Test void rejectsInvalidTranslationWithoutRenderingAndKeepsSanitizedReceipt() {
        accepted();
        var region = new OcrManifest.Region(UUID.randomUUID(), 0, "private-source", List.of(
            new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.9, .1), new OcrManifest.Vertex(.9, .9), new OcrManifest.Vertex(.1, .9)));
        when(ocr.recognize(any(), anyString(), any(), anyInt(), anyInt())).thenReturn(List.of(region));
        when(translation.translate(any())).thenReturn(new com.toonlira.translationgateway.domain.translation.TranslationResponse(List.of()));
        assertThatThrownBy(() -> useCase.execute(owner, key, command(), new ByteArrayInputStream(original), (m, i, fence) -> fail("No delivery")))
            .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE));
        verify(renderer, never()).render(any(), any());
        verify(attempts).finish(operation, VolatileAttemptRepository.Status.FAILED, "translation-invalid-response");
    }

    @Test void abandonmentDuringDurableReservationCannotStartOcr() {
        accepted();
        when(attempts.reserve(owner, key)).thenAnswer(call -> {
            abandoned.set(true);
            return new VolatileAttemptRepository.Receipt(operation, VolatileAttemptRepository.Status.STARTED, Instant.now(), null, null);
        });
        expectAbandoned();
        verifyNoInteractions(ocr, translation);
        verify(renderer, never()).render(any(), any());
        verify(attempts).finish(operation, VolatileAttemptRepository.Status.FAILED, "internal-error");
    }

    @Test void abandonmentDuringOcrEncodingCannotStartTranslation() {
        accepted(); validNonemptyProviders();
        doAnswer(call -> { var encoded = call.callRealMethod(); abandoned.set(true); return encoded; })
            .when(ocrManifests).encode(any());
        expectAbandoned();
        verifyNoInteractions(translation);
        verify(renderer, never()).render(any(), any());
    }

    @Test void abandonmentDuringTranslationEncodingCannotStartNativeRender() {
        accepted(); validNonemptyProviders();
        doAnswer(call -> { var encoded = call.callRealMethod(); abandoned.set(true); return encoded; })
            .when(translationManifests).encode(any(), anyString());
        expectAbandoned();
        verify(translation).translate(any());
        verify(renderer, never()).render(any(), any());
    }

    @ParameterizedTest @ValueSource(strings = {"ocr", "translation"})
    void providerResolutionCannotStartAnExternalCallAfterAbandonment(String stage) {
        accepted(); validNonemptyProviders();
        var recognizer = provider(ocr); var translator = provider(translation);
        if (stage.equals("ocr")) when(recognizer.getObject()).thenAnswer(call -> { abandoned.set(true); return ocr; });
        else when(translator.getObject()).thenAnswer(call -> { abandoned.set(true); return translation; });
        configureProviders(recognizer, translator, provider(renderer));
        expectAbandoned();
        if (stage.equals("ocr")) verifyNoInteractions(ocr);
        verifyNoInteractions(translation);
        verify(renderer, never()).render(any(), any());
    }

    private void validNonemptyProviders() {
        var region = new OcrManifest.Region(UUID.randomUUID(), 0, "synthetic-source", List.of(
            new OcrManifest.Vertex(.1,.1), new OcrManifest.Vertex(.9,.1), new OcrManifest.Vertex(.9,.9), new OcrManifest.Vertex(.1,.9)));
        when(ocr.recognize(any(), anyString(), any(), anyInt(), anyInt())).thenReturn(List.of(region));
        when(translation.translate(any())).thenReturn(new TranslationResponse(List.of(new TranslationResponse.Region(region.id(), "synthetic-target"))));
    }
    private void expectAbandoned() {
        assertThatThrownBy(() -> useCase.execute(owner, key, command(), new ByteArrayInputStream(original), (m, i, f) -> fail("No delivery")))
            .isInstanceOf(GatewayException.class);
    }
    private void configureProviders(ObjectProvider<InlineOcrPort> recognizer, ObjectProvider<TranslationPort> translator,
                                    ObjectProvider<VolatileRenderPort> render) {
        useCase = new ProcessVolatilePageUseCase(properties, attempts, recognizer, translator, render,
            ocrManifests, translationManifests, new RenderManifestService(GatewayJsonMapper.create()),
            (work, cancellation) -> work.accept(() -> {
                if (abandoned.get()) throw new GatewayException(GatewayErrorCode.CAPABILITIES_UNAVAILABLE, 503, false);
            }));
    }

    private void accepted() {
        when(attempts.find(owner, key)).thenReturn(Optional.empty());
        when(attempts.reserve(owner, key)).thenReturn(new VolatileAttemptRepository.Receipt(operation,
            VolatileAttemptRepository.Status.STARTED, Instant.now(), null, null));
    }
    private ProcessVolatilePageUseCase.Command command() {
        return new ProcessVolatilePageUseCase.Command("image/png", original.length, 32, 16, "ja", "pt-BR", "volatile-1");
    }
    @SuppressWarnings("unchecked") private static <T> ObjectProvider<T> provider(T value) {
        ObjectProvider<T> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(value); return provider;
    }
}
