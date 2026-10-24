package com.toonlira.translationgateway.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import tools.jackson.databind.node.ObjectNode;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class OcrEvaluationHarnessTest extends EvaluationHarness {
    @TempDir Path temporary;

    @Test
    void shouldExportThroughControllerWithoutChangingOriginalOrCallingTwice() throws Exception {
        var input = image();
        var before = Files.readAllBytes(input);
        var output = Files.createDirectory(temporary.resolve("result"));
        var result = evaluate(input, sample(input), output, "offline", "", "", false, "success");
        assertThat(result.get("status")).as("phase=%s code=%s http=%s", result.get("failurePhase"), result.get("errorCode"), result.get("httpStatus")).isEqualTo("succeeded");
        assertThat(result.get("rpcCalls")).as("phase=%s code=%s http=%s", result.get("failurePhase"), result.get("errorCode"), result.get("httpStatus")).isEqualTo(1);
        assertThat(result.get("jobStatus")).isEqualTo("TRANSLATING");
        assertThat(result.get("cleanupPending")).isEqualTo(false);
        assertThat(Files.readAllBytes(input)).isEqualTo(before);
        assertThat(Files.exists(output.resolve("manifest.json"))).isTrue();
        assertThat(Files.exists(output.resolve("vision-response.pb"))).isTrue();
        assertThat(result.get("rawResponse")).isInstanceOf(Map.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"unavailable", "timeout", "invalid-response", "upload-failure", "rollback", "lost-ack", "concurrent", "cancel"})
    void shouldRecordFailuresAndLostAckWithoutSecondCall(String scenario) throws Exception {
        var input = image();
        var output = Files.createDirectory(temporary.resolve("result"));
        var result = evaluate(input, sample(input), output, "offline", "", "", false, scenario);
        assertThat(result.get("rpcCalls")).isEqualTo(1);
        assertThat(result.get("status")).isEqualTo(List.of("lost-ack", "concurrent").contains(scenario) ? "succeeded" : "failed");
        if (scenario.equals("cancel")) assertThat(result.get("jobStatus")).isEqualTo("CANCELLED");
        assertThat(result.get("cleanupPending")).isEqualTo(false);
        var capture = (Map<?, ?>) result.get("rawResponse");
        assertThat(capture.get("status")).isEqualTo(List.of("unavailable", "timeout").contains(scenario) ? "not-received" : "captured");
    }

    @Test void captureFailureCannotBeReportedAsSuccessfulOcrOrTriggerAnotherCall() throws Exception {
        var input = image();
        var output = Files.createDirectory(temporary.resolve("result"));
        var existing = output.resolve("vision-response.pb");
        Files.writeString(existing, "preserve-existing");
        var result = evaluate(input, sample(input), output, "offline", "", "", false, "success");
        assertThat(result.get("status")).isEqualTo("failed");
        assertThat(result.get("errorCode")).isEqualTo("evaluation-raw-capture-unavailable");
        assertThat(result.get("rpcCalls")).isEqualTo(1);
        assertThat(Files.readString(existing)).isEqualTo("preserve-existing");
    }

    @Test
    void shouldRefuseRealModeBeforeAnyClientInitialization() throws Exception {
        var input = image();
        assertThatThrownBy(() -> evaluate(input, sample(input), temporary, "vision", "test-project", "test-bucket", false, "success"))
            .hasMessage("evaluation-configuration-invalid");
    }

    @Test
    void shouldRefuseTamperedSampleBeforeStorageOrProvider() throws Exception {
        var input = image();
        var expected = sample(input);
        Files.writeString(input, "tampered");
        var result = evaluate(input, expected, temporary, "offline", "", "", false, "success");
        assertThat(result.get("status")).isEqualTo("failed");
        assertThat(result.get("rpcCalls")).isEqualTo(0);
    }

    @Test
    void shouldNeverInitializeAdcStorageOrProductionVisionFactoryOffline() throws Exception {
        var input = image();
        var output = Files.createDirectory(temporary.resolve("result"));
        try (var cloud = org.mockito.Mockito.mockStatic(com.google.cloud.storage.StorageOptions.class);
             var credentials = org.mockito.Mockito.mockStatic(EvaluationCredentials.class);
             var factory = org.mockito.Mockito.mockConstruction(com.toonlira.translationgateway.infrastructure.ocr.VisionClientFactory.class)) {
            var result = evaluate(input, sample(input), output, "offline", "", "", false, "success");
            assertThat(result.get("status")).isEqualTo("succeeded");
            cloud.verifyNoInteractions();
            credentials.verifyNoInteractions();
            assertThat(factory.constructed()).isEmpty();
        }
    }

    @Test
    void shouldReportCleanupFailureWithoutExpandingItsScope() {
        var scoped = new EvaluationStorage();
        scoped.reset(temporary, mapper);
        scoped.local = temporary;
        scoped.originalKey = "private/originals/owned-fixture";
        scoped.delegate = org.mockito.Mockito.mock(com.toonlira.translationgateway.application.port.ObjectStoragePort.class);
        scoped.keys.add(scoped.originalKey);
        org.mockito.Mockito.doThrow(new IllegalStateException("sanitized-test-failure")).when(scoped.delegate).delete(scoped.originalKey);
        assertThat(scoped.cleanup()).isTrue();
        org.mockito.Mockito.verify(scoped.delegate).delete(scoped.originalKey);
        org.mockito.Mockito.verifyNoMoreInteractions(scoped.delegate);
        assertThatThrownBy(() -> scoped.deleteOlderThan(java.time.Instant.now())).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> scoped.open("private/originals/unrelated")).isInstanceOf(IllegalArgumentException.class);
    }

    private Path image() throws Exception {
        var input = temporary.resolve("input.jpg");
        ImageIO.write(new BufferedImage(200, 300, BufferedImage.TYPE_INT_RGB), "jpg", input.toFile());
        return input;
    }

    @Test
    void shouldAcceptPngAndRejectDeclaredMimeMismatchWithoutAnotherCall() throws Exception {
        var input = temporary.resolve("input.png");
        ImageIO.write(new BufferedImage(200, 300, BufferedImage.TYPE_INT_RGB), "png", input.toFile());
        var expected = (ObjectNode) sample(input);
        expected.put("mime", "image/png");
        expected.put("language", "zh-Hant");
        var before = Files.readAllBytes(input);
        var output = Files.createDirectory(temporary.resolve("png-result"));
        var result = evaluate(input, expected, output, "offline", "", "", false, "success");
        assertThat(result.get("status")).isEqualTo("succeeded");
        assertThat(result.get("rpcCalls")).isEqualTo(1);
        assertThat(Files.readAllBytes(input)).isEqualTo(before);
        assertThat(mapper.readTree(output.resolve("manifest.json").toFile()).path("sourceLanguage").asText()).isEqualTo("zh-Hant");
        expected.put("mime", "image/jpeg");
        var failure = evaluate(input, expected, Files.createDirectory(temporary.resolve("mismatch")), "offline", "", "", false, "success");
        assertThat(failure.get("errorCode")).isEqualTo("ocr-invalid-media");
        assertThat(failure.get("rpcCalls")).isEqualTo(0);
    }
}
