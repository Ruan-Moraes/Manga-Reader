package com.toonlira.translationgateway.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.mockConstruction;

import com.google.cloud.storage.StorageOptions;
import com.toonlira.translationgateway.infrastructure.ocr.VisionClientFactory;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class CalibrationWorkerTest extends EvaluationHarness {
    @TempDir Path temporary;

    @Test void exportsBoundPngCaptureWithReplayAndNoCloudClient() throws Exception {
        var root = temporary.toRealPath();
        var request = CalibrationAdmissionTest.fixture(root, "control");
        var admitted = CalibrationAdmission.admit(root, request);
        var before = Files.readAllBytes(admitted.image());
        var output = Files.createDirectory(root.resolve("output"));
        try (var cloud = mockStatic(StorageOptions.class);
             var credentials = mockStatic(EvaluationCredentials.class);
             var factory = mockConstruction(VisionClientFactory.class)) {
            var result = evaluate(admitted.image(), admitted.sample(), output, "offline", "", "", false, "success");
            CalibrationAdmission.exportDiagnostic(output, result);
            assertThat(result.get("status")).as("phase=%s code=%s", result.get("failurePhase"), result.get("errorCode")).isEqualTo("succeeded");
            assertThat(result.get("rpcCalls")).isEqualTo(1);
            assertThat(result.get("stageStatus")).isEqualTo("SUCCEEDED");
            assertThat(result.get("jobStatus")).isEqualTo("TRANSLATING");
            assertThat(result.get("cleanupPending")).isEqualTo(false);
            assertThat(((Map<?, ?>) result.get("rawResponse")).get("synthetic")).isEqualTo(true);
            assertThat(hash(Files.readAllBytes(output.resolve("diagnostic.json")))).isEqualTo(result.get("diagnosticSha256"));
            assertThat(Files.readAllBytes(admitted.image())).isEqualTo(before);
            cloud.verifyNoInteractions(); credentials.verifyNoInteractions(); assertThat(factory.constructed()).isEmpty();
        }
    }

    @ParameterizedTest @ValueSource(strings = {"timeout", "upload-failure", "rollback", "lost-ack", "concurrent", "cancel"})
    void preservesFailureIsolationAndSingleCallForControls(String scenario) throws Exception {
        var root = temporary.toRealPath();
        var admitted = CalibrationAdmission.admit(root, CalibrationAdmissionTest.fixture(root, "control"));
        var output = Files.createDirectory(root.resolve("output"));
        var result = evaluate(admitted.image(), admitted.sample(), output, "offline", "", "", false, scenario);
        CalibrationAdmission.exportDiagnostic(output, result);
        var success = List.of("lost-ack", "concurrent").contains(scenario);
        assertThat(result.get("status")).isEqualTo(success ? "succeeded" : "failed");
        assertThat(result.get("rpcCalls")).as("phase=%s code=%s", result.get("failurePhase"), result.get("errorCode")).isEqualTo(1);
        assertThat(Files.exists(output.resolve("diagnostic.json"))).isEqualTo(success);
        assertThat(result.get("cleanupPending")).isEqualTo(false);
    }
}
