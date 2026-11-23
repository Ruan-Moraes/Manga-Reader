package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import java.util.UUID;
import java.util.List;
import org.junit.jupiter.api.Test;

class LoopbackWorkerProvidersTest {
    private static final LanguagePair PAIR = new LanguagePair("en", "pt-BR");

    @Test void officialClientsPreserveIdsAndBothOutputBoundariesWithSyntheticExpansion() throws Exception {
        var job = UUID.randomUUID();
        try (var providers = new LoopbackWorkerProviders()) {
            var regions = providers.recognize(command(job), 64, 256);
            assertThat(regions).hasSize(64);
            for (int index = 0; index < regions.size(); index++) {
                assertThat(regions.get(index).id()).isEqualTo(LoopbackWorkerProviders.regionId(job, index));
                assertThat(regions.get(index).readingOrder()).isEqualTo(index);
                assertThat(regions.get(index).sourceText()).isEqualTo("a".repeat(256));
            }
            var result = providers.translate(request(job, regions), "b".repeat(8192));
            assertThat(result.regions()).extracting(region -> region.id())
                .containsExactlyElementsOf(regions.stream().map(region -> region.id()).toList());
            assertThat(result.regions()).allSatisfy(region -> assertThat(region.translatedText()).hasSize(8192));
            assertThat(result.regions().stream().mapToInt(region -> region.translatedText().length()).sum()).isEqualTo(524288);
            assertThat(providers.visionCalls()).isOne();
            assertThat(providers.translationCalls()).isOne();
        }
    }

    @Test void genuineSyntheticEmptyResponseNeverCallsTheTranslationTransport() throws Exception {
        var job = UUID.randomUUID();
        try (var providers = new LoopbackWorkerProviders()) {
            var regions = providers.recognize(command(job), 0, 0);
            assertThat(regions).isEmpty();
            assertThat(providers.translate(request(job, regions), "").regions()).isEmpty();
            assertThat(providers.visionCalls()).isOne();
            assertThat(providers.translationCalls()).isZero();
        }
    }

    @Test void maximumOcrTextRemainsRejectedByTheApprovedProviderBoundaryWithoutRpc() throws Exception {
        var job = UUID.randomUUID();
        try (var providers = new LoopbackWorkerProviders()) {
            var regions = providers.recognize(command(job), 1024, 256);
            assertThat(regions).hasSize(1024);
            assertThat(regions.stream().mapToInt(region -> region.sourceText().length()).sum()).isEqualTo(262144);
            assertThatThrownBy(() -> providers.translate(request(job, regions), "b".repeat(512)))
                .isInstanceOfSatisfying(GatewayException.class, error -> {
                    assertThat(error.code()).isEqualTo(GatewayErrorCode.TRANSLATION_INVALID_REQUEST);
                    assertThat(error.getCause()).isNull();
                    assertThat(error.getMessage()).doesNotContain(job.toString(), "private/originals/fixture", "a".repeat(256));
                });
            assertThat(providers.visionCalls()).isOne();
            assertThat(providers.translationCalls()).isZero();
        }
    }

    private static OcrPort.Command command(UUID job) {
        return new OcrPort.Command("private/originals/fixture", "en", job, 10000, 8000);
    }

    private static TranslationRequest request(UUID job, List<OcrManifest.Region> regions) {
        return new TranslationRequest(job, PAIR, regions.stream()
            .map(region -> new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
    }
}
