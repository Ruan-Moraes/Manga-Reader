package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.toonlira.translationgateway.application.OcrManifestService;
import com.toonlira.translationgateway.application.ProcessVolatilePageUseCase;
import com.toonlira.translationgateway.application.RenderManifestService;
import com.toonlira.translationgateway.application.TranslationManifestService;
import com.toonlira.translationgateway.application.VolatileAttemptUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.InlineOcrPort;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.application.port.VolatileAttemptRepository;
import com.toonlira.translationgateway.application.port.VolatileRenderPort;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import javax.imageio.ImageIO;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.ObjectProvider;

/** Actual supervisor deadline and use case together; the blocked collaborator deliberately consumes interruption. */
class VolatileStageDeadlineTest {
    @ParameterizedTest @ValueSource(strings = {"reservation", "ocr-preparation", "translation-preparation"})
    void expiredSessionCannotBeginTheNextStageWhenBlockedPreparationReturns(String stage) throws Exception {
        var entered = new CountDownLatch(1); var release = new CountDownLatch(1); var closed = new CountDownLatch(1);
        var closedStatus = new AtomicReference<VolatileAttemptRepository.Status>();
        var properties = properties(); var sessions = new SupervisedVolatileSession(Duration.ofMillis(500));
        var attempts = mock(VolatileAttemptUseCase.class); var ocr = mock(InlineOcrPort.class);
        var translation = mock(TranslationPort.class); var renderer = mock(VolatileRenderPort.class);
        var mapper = GatewayJsonMapper.create();
        var ocrManifests = spy(new OcrManifestService(mapper));
        var translationManifests = spy(new TranslationManifestService(mapper));
        var owner = UUID.randomUUID(); var key = UUID.randomUUID(); var operation = UUID.randomUUID();
        when(attempts.find(owner, key)).thenReturn(Optional.empty());
        when(attempts.reserve(owner, key)).thenAnswer(call -> {
            if (stage.equals("reservation")) pause(entered, release);
            return new VolatileAttemptRepository.Receipt(operation, VolatileAttemptRepository.Status.STARTED, Instant.now(), null, null);
        });
        doAnswer(call -> { closedStatus.set(call.getArgument(1)); closed.countDown(); return null; }).when(attempts).finish(any(), any(), any());
        var region = new OcrManifest.Region(UUID.randomUUID(), 0, "synthetic-source", List.of(new OcrManifest.Vertex(.1,.1),
            new OcrManifest.Vertex(.9,.1), new OcrManifest.Vertex(.9,.9), new OcrManifest.Vertex(.1,.9)));
        when(ocr.recognize(any(), anyString(), any(), anyInt(), anyInt())).thenReturn(List.of(region));
        when(translation.translate(any())).thenReturn(new TranslationResponse(List.of(new TranslationResponse.Region(region.id(), "synthetic-target"))));
        if (stage.equals("ocr-preparation")) doAnswer(call -> {
            var encoded = call.callRealMethod(); pause(entered, release); return encoded;
        }).when(ocrManifests).encode(any());
        if (stage.equals("translation-preparation")) doAnswer(call -> {
            var encoded = call.callRealMethod(); pause(entered, release); return encoded;
        }).when(translationManifests).encode(any(), anyString());
        var useCase = new ProcessVolatilePageUseCase(properties, attempts, provider(ocr), provider(translation), provider(renderer),
            ocrManifests, translationManifests, new RenderManifestService(mapper), sessions);
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(32, 16, BufferedImage.TYPE_INT_RGB), "png", bytes);
        byte[] original = bytes.toByteArray(); var failure = new AtomicReference<Throwable>();
        var caller = Thread.ofVirtual().start(() -> {
            try { useCase.execute(owner, key, new ProcessVolatilePageUseCase.Command("image/png", original.length,32,16,"ja","pt-BR","volatile-test"),
                new ByteArrayInputStream(original), (manifest, image, fence) -> { throw new AssertionError("Late delivery"); }); }
            catch (Throwable error) { failure.set(error); }
        });
        try {
            assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
            caller.join(3000);
            assertThat(caller.isAlive()).isFalse();
            assertThat(failure.get()).isInstanceOf(GatewayException.class);
            assertThatThrownBy(() -> sessions.execute(fence -> { throw new AssertionError("Still owned"); }, () -> { }))
                .isInstanceOf(GatewayException.class);
        } finally { release.countDown(); }
        assertThat(closed.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(closedStatus.get()).isEqualTo(VolatileAttemptRepository.Status.FAILED);
        if (stage.equals("reservation")) verifyNoInteractions(ocr);
        if (!stage.equals("translation-preparation")) verifyNoInteractions(translation);
        verify(renderer, never()).render(any(), any());
        long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (true) {
            try { sessions.execute(fence -> { }, () -> { }); break; }
            catch (GatewayException busy) { if (System.nanoTime() >= until) throw busy; Thread.sleep(5); }
        }
        assertThat(original).startsWith((byte)0x89, (byte)0x50);
    }
    private static void pause(CountDownLatch entered, CountDownLatch release) {
        entered.countDown();
        while (true) { try { release.await(); break; } catch (InterruptedException ignored) { } }
        Thread.interrupted();
    }
    private static GatewayProperties properties() {
        var properties = new GatewayProperties(); properties.setEnabled(true); properties.setVolatileProcessingEnabled(true);
        var disclosure = properties.getDisclosure(); disclosure.setVersion("volatile-test"); disclosure.setOperatorName("Synthetic operator");
        disclosure.setOperatorContact("fixture@example.test"); disclosure.setPrivacyPolicyUrl("https://example.test/privacy");
        disclosure.setTermsUrl("https://example.test/terms"); disclosure.setProviderTrainingPolicy("Synthetic fixture; no provider calls");
        properties.getTranslation().setEnabledPairs(List.of("ja:pt-BR")); return properties;
    }
    @SuppressWarnings("unchecked") private static <T> ObjectProvider<T> provider(T object) {
        ObjectProvider<T> provider = mock(ObjectProvider.class); when(provider.getObject()).thenReturn(object); return provider;
    }
}
