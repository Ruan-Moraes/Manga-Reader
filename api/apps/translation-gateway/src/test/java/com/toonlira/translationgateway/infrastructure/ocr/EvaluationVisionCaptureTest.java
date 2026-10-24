package com.toonlira.translationgateway.infrastructure.ocr;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.TextAnnotation;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrLimits;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class EvaluationVisionCaptureTest {
    @TempDir Path temporary;

    @Test void capturesUnmappedSyntheticResponsePrivatelyThroughRealGrpc() throws Exception {
        var capture = new EvaluationVisionCapture(temporary, true);
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(2), capture), "test-project", "private-fixtures")) {
            adapter.recognize(new OcrPort.Command("private/originals/example", "ja", UUID.randomUUID(), 100, 200));
            assertThat(server.calls.get()).isEqualTo(1);
            assertThat(BatchAnnotateImagesResponse.parseFrom(Files.readAllBytes(temporary.resolve("vision-response.pb"))))
                .isEqualTo(VisionResponseMapperTest.response());
            assertThat(Files.getPosixFilePermissions(temporary.resolve("vision-response.pb")))
                .isEqualTo(PosixFilePermissions.fromString("rw-------"));
            assertThat(capture.metadata()).containsEntry("status", "captured").containsEntry("synthetic", true);
        }
    }

    @Test void preservesInvalidProviderResponseBeforeMapperRejectsIt() throws Exception {
        var capture = new EvaluationVisionCapture(temporary, true);
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(2), capture), "test-project", "private-fixtures")) {
            server.handler = (request, observer) -> { observer.onNext(BatchAnnotateImagesResponse.getDefaultInstance()); observer.onCompleted(); };
            assertThatThrownBy(() -> adapter.recognize(
                new OcrPort.Command("private/originals/example", "ja", UUID.randomUUID(), 100, 200)))
                .isInstanceOf(GatewayException.class);
            assertThat(capture.metadata()).containsEntry("status", "captured");
            assertThat(Files.size(temporary.resolve("vision-response.pb"))).isZero();
        }
    }

    @Test void refusesOverwriteOversizeAndUnavailableDestinationWithoutLoggingPayload() throws Exception {
        var capture = new EvaluationVisionCapture(temporary, true);
        capture.capture(VisionResponseMapperTest.response());
        var before = Files.readAllBytes(temporary.resolve("vision-response.pb"));
        capture.capture(VisionResponseMapperTest.response());
        assertThat(capture.metadata()).containsEntry("status", "capture-failed");
        assertThat(Files.readAllBytes(temporary.resolve("vision-response.pb"))).isEqualTo(before);
        var elsewhere = Files.createDirectory(temporary.resolve("oversize"));
        var oversized = BatchAnnotateImagesResponse.newBuilder().addResponses(
            AnnotateImageResponse.newBuilder().setFullTextAnnotation(
                TextAnnotation.newBuilder().setText("x".repeat(OcrLimits.MAX_RESPONSE_BYTES + 1)))).build();
        var bounded = new EvaluationVisionCapture(elsewhere, false);
        bounded.capture(oversized);
        assertThat(bounded.metadata()).containsEntry("status", "capture-failed");
        assertThat(Files.exists(elsewhere.resolve("vision-response.pb"))).isFalse();
        var unavailable = new EvaluationVisionCapture(temporary.resolve("missing"), true);
        unavailable.capture(VisionResponseMapperTest.response());
        assertThat(unavailable.metadata()).containsEntry("status", "capture-failed");
    }
}
