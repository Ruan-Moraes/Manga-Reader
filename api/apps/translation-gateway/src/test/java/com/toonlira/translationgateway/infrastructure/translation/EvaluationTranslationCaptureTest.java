package com.toonlira.translationgateway.infrastructure.translation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.translate.v3.TranslateTextResponse;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class EvaluationTranslationCaptureTest {
    @TempDir Path directory;

    @Test void capturesExactResponsePrivatelyWithoutPuttingDialogueInMetadata() throws Exception {
        var capture = new EvaluationTranslationCapture(directory, true);
        var response = response("private-dialogue");
        capture.capture(response);

        var bytes = Files.readAllBytes(directory.resolve(EvaluationTranslationCapture.FILE));
        assertThat(bytes).isEqualTo(response.toByteArray());
        assertThat(capture.metadata()).containsEntry("status", "captured").containsEntry("synthetic", true)
            .containsEntry("sha256", HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)));
        assertThat(capture.metadata().toString()).doesNotContain("private-dialogue");
        assertThat(Files.getPosixFilePermissions(directory.resolve(EvaluationTranslationCapture.FILE)))
            .isEqualTo(PosixFilePermissions.fromString("rw-------"));
    }

    @Test void refusesOverwriteAndDuplicateCaptureWithoutReplacingEvidence() throws Exception {
        var capture = new EvaluationTranslationCapture(directory, false);
        var response = response("first");
        capture.capture(response);
        capture.capture(response("second"));

        assertThat(Files.readAllBytes(directory.resolve(EvaluationTranslationCapture.FILE))).isEqualTo(response.toByteArray());
        assertThat(capture.metadata()).containsEntry("status", "capture-failed");
    }

    @Test void rejectsOversizedResponseBeforeWriting() {
        var capture = new EvaluationTranslationCapture(directory, false);
        capture.capture(response("x".repeat(4 * 1024 * 1024)));
        assertThat(capture.metadata()).containsEntry("status", "capture-failed");
        assertThat(directory.resolve(EvaluationTranslationCapture.FILE)).doesNotExist();
    }

    @Test void capturesThroughGrpcBeforeStrictAdapterDecodingAndNeverRetries() throws Exception {
        var capture = new EvaluationTranslationCapture(directory, true);
        try (var server = new FakeTranslationServer();
             var adapter = new CloudTranslationAdapter(server.client(Duration.ofSeconds(2), capture), "test-project")) {
            var id = UUID.randomUUID();
            var request = new TranslationRequest(UUID.randomUUID(), new LanguagePair("en", "pt-BR"),
                List.of(new TranslationRequest.Region(id, 0, "synthetic-dialogue")));
            assertThat(adapter.translate(request).regions().getFirst().translatedText()).isEqualTo("synthetic-dialogue");
            assertThat(server.calls.get()).isEqualTo(1);
            assertThat(capture.metadata()).containsEntry("status", "captured").containsEntry("grpcStatus", "OK");
            var captured = TranslateTextResponse.parseFrom(Files.readAllBytes(directory.resolve(EvaluationTranslationCapture.FILE)));
            assertThat(captured.getTranslations(0).getTranslatedText()).isEqualTo(server.lastRequest.getContents(0));
        }
    }

    @Test void preservesInvalidResponseBeforeAdapterRejectsIt() throws Exception {
        var capture = new EvaluationTranslationCapture(directory, true);
        try (var server = new FakeTranslationServer();
             var adapter = new CloudTranslationAdapter(server.client(Duration.ofSeconds(2), capture), "test-project")) {
            server.handler = (request, observer) -> {
                observer.onNext(TranslateTextResponse.getDefaultInstance());
                observer.onCompleted();
            };
            var request = new TranslationRequest(UUID.randomUUID(), new LanguagePair("en", "pt-BR"),
                List.of(new TranslationRequest.Region(UUID.randomUUID(), 0, "synthetic-dialogue")));
            assertThatThrownBy(() -> adapter.translate(request)).isInstanceOf(GatewayException.class);
            assertThat(server.calls.get()).isEqualTo(1);
            assertThat(capture.metadata()).containsEntry("status", "captured");
            assertThat(Files.size(directory.resolve(EvaluationTranslationCapture.FILE))).isZero();
        }
    }

    @Test void realSettingsUseExplicitCredentialsQuotaGlobalEndpointAndNoRetry() throws Exception {
        var credentials = GoogleCredentials.create(new AccessToken("synthetic-not-a-credential", Date.from(Instant.now().plusSeconds(60))))
            .createWithQuotaProject("test-project");
        var settings = EvaluationTranslationCapture.settings(credentials, new EvaluationTranslationCapture(directory, false));
        assertThat(settings.getEndpoint()).isEqualTo("translate.googleapis.com:443");
        assertThat(settings.getQuotaProjectId()).isEqualTo("test-project");
        assertThat(settings.getCredentialsProvider().getCredentials()).isSameAs(credentials);
        assertThat(settings.translateTextSettings().getRetryableCodes()).isEmpty();
        assertThat(settings.translateTextSettings().getRetrySettings().getMaxAttempts()).isEqualTo(1);
    }

    private static TranslateTextResponse response(String text) {
        var builder = TranslateTextResponse.newBuilder();
        builder.addTranslationsBuilder().setModel("projects/test-project/locations/global/models/general/translation-llm")
            .setTranslatedText(text);
        return builder.build();
    }
}
