package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.application.OcrManifestService;
import com.toonlira.translationgateway.application.TranslationManifestService;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class RecordedWorkerPageTest {
    @TempDir Path root;
    private final UUID job = UUID.randomUUID(), region = UUID.randomUUID();
    private final OcrManifest ocr = new OcrManifest("1.0", job, "en", 900, 600, List.of(
        new OcrManifest.Region(region, 0, "Hello!", List.of(new OcrManifest.Vertex(.1, .2),
            new OcrManifest.Vertex(.8, .2), new OcrManifest.Vertex(.8, .5), new OcrManifest.Vertex(.1, .5)))));
    private final TranslationRequest request = new TranslationRequest(job, new LanguagePair("en", "pt-BR"),
        List.of(new TranslationRequest.Region(region, 0, "Hello!")));

    @Test
    void preservesCapturedGeometryIdsAndTextWithoutManufacturingProviderOutput() throws Exception {
        fixture();
        var page = RecordedWorkerPage.load(root);
        assertThat(page.recognize(new OcrPort.Command("unused", "en", job, 900, 600))).isEqualTo(ocr.regions());
        assertThat(page.translate(request).regions()).containsExactly(new TranslationResponse.Region(region, "Olá!"));
        assertThat(page.jobRef()).isEqualTo(job);
        assertThat(page.sourceSha256()).isEqualTo("a".repeat(64));
    }

    @Test
    void rejectsDifferentSourceIdentityOrRegionText() throws Exception {
        fixture();
        var page = RecordedWorkerPage.load(root);
        assertThatThrownBy(() -> page.recognize(new OcrPort.Command("unused", "en", UUID.randomUUID(), 900, 600)))
            .isInstanceOf(IllegalArgumentException.class);
        var changed = new TranslationRequest(job, request.pair(), List.of(new TranslationRequest.Region(region, 0, "Other")));
        assertThatThrownBy(() -> page.translate(changed)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsChangedCaptureAndSymlink() throws Exception {
        fixture();
        Files.writeString(root.resolve("translation-manifest.json"), "{}");
        assertThatThrownBy(() -> RecordedWorkerPage.load(root)).isInstanceOf(RuntimeException.class);
        Files.delete(root.resolve("translation-manifest.json"));
        Files.createSymbolicLink(root.resolve("translation-manifest.json"), root.resolve("ocr-manifest.json"));
        assertThatThrownBy(() -> RecordedWorkerPage.load(root)).isInstanceOf(IllegalArgumentException.class);
    }

    private void fixture() throws Exception {
        var mapper = GatewayJsonMapper.create();
        var encodedOcr = new OcrManifestService(mapper).encode(ocr);
        var translated = new TranslationValidator(Set.of(request.pair())).validateResponse(request,
            new TranslationResponse(List.of(new TranslationResponse.Region(region, "Olá!"))));
        var encodedTranslation = new TranslationManifestService(mapper).encode(translated, encodedOcr.sha256());
        Files.write(root.resolve("ocr-manifest.json"), encodedOcr.bytes());
        Files.write(root.resolve("translation-manifest.json"), encodedTranslation.bytes());
        Files.write(root.resolve("receipt.json"), mapper.writeValueAsBytes(Map.of(
            "outcome", "captured-real-response-validated", "newPaidCalls", 0, "sourceSha256", "a".repeat(64),
            "ocrManifestSha256", encodedOcr.sha256(), "translationManifestSha256", encodedTranslation.sha256())));
    }
}
