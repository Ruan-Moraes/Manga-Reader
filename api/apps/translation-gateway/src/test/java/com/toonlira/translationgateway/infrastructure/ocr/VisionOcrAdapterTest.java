package com.toonlira.translationgateway.infrastructure.ocr;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static com.toonlira.translationgateway.infrastructure.ocr.VisionResponseMapperTest.COMMAND;

import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Feature;
import com.google.rpc.Status;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrLimits;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(OutputCaptureExtension.class)
class VisionOcrAdapterTest {
    @Test
    void buildsRegionalGcsRequestAndNeverSendsBytes() throws Exception {
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project", "private-fixtures")) {
            assertThat(adapter.recognize(COMMAND)).isEmpty();
            var request = server.lastRequest;
            assertThat(request.getParent()).isEqualTo("projects/test-project/locations/us");
            assertThat(request.getRequestsCount()).isOne();
            var image = request.getRequests(0);
            assertThat(image.getImage().getSource().getGcsImageUri()).isEqualTo("gs://private-fixtures/" + COMMAND.objectKey());
            assertThat(image.getImage().getContent().isEmpty()).isTrue();
            assertThat(image.getFeatures(0).getType()).isEqualTo(Feature.Type.DOCUMENT_TEXT_DETECTION);
            assertThat(image.getImageContext().getLanguageHintsList()).containsExactly("ja");
            assertThat(server.calls).hasValue(1);
        }
        var settings = VisionClientFactory.settings();
        assertThat(settings.getEndpoint()).isEqualTo("us-vision.googleapis.com:443");
        assertThat(settings.batchAnnotateImagesSettings().getRetryableCodes()).isEmpty();
        assertThat(settings.batchAnnotateImagesSettings().getRetrySettings().getMaxAttempts()).isOne();
        assertThat(settings.batchAnnotateImagesSettings().getRetrySettings().getTotalTimeoutDuration()).isEqualTo(Duration.ofSeconds(60));
    }

    @Test
    void neverRetriesTransportFailureAndDoesNotLeakRawErrors(CapturedOutput output) throws Exception {
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(2)), "test-project", "private-fixtures")) {
            server.handler = (request, observer) -> observer.onError(io.grpc.Status.UNAVAILABLE
                .withDescription("sensitive-provider-response-gs://private-fixtures").asRuntimeException());
            assertUnavailable(adapter);
            assertThat(server.calls).hasValue(1);
            assertThat(output).doesNotContain("sensitive-provider-response", "private-fixtures", COMMAND.jobRef().toString());
        }
    }

    @Test
    void neverRetriesAnAmbiguousTimeout() throws Exception {
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofMillis(400)), "test-project", "private-fixtures")) {
            server.handler = (request, observer) -> { /* Accepted, but response lost. */ };
            assertUnavailable(adapter);
            assertThat(server.calls).hasValue(1);
        }
    }

    @Test
    void rejectsEmbeddedProviderErrorAndOversizedTransportResponse() throws Exception {
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project", "private-fixtures")) {
            server.handler = (request, observer) -> {
                observer.onNext(BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder()
                    .setError(Status.newBuilder().setCode(8).setMessage("raw-provider-error"))).build());
                observer.onCompleted();
            };
            assertUnavailable(adapter);
            assertThat(server.calls).hasValue(1);
            server.handler = (request, observer) -> {
                observer.onNext(BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder()
                    .setError(Status.newBuilder().setCode(8).setMessage("x".repeat(OcrLimits.MAX_RESPONSE_BYTES + 1)))).build());
                observer.onCompleted();
            };
            assertUnavailable(adapter);
            assertThat(server.calls).hasValue(2);
        }
    }

    @Test
    void rejectsUntrustedObjectKeysAndLanguageBeforeRpc() throws Exception {
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project", "private-fixtures")) {
            for (var key : new String[] {"https://evil.invalid/image", "private/originals/../../secret", "private/originals/a?generation=1"}) {
                assertThatThrownBy(() -> adapter.recognize(new OcrPort.Command(key, "ja", COMMAND.jobRef(), 100, 200)))
                    .isInstanceOf(GatewayException.class);
            }
            assertThatThrownBy(() -> adapter.recognize(new OcrPort.Command(COMMAND.objectKey(), "auto", COMMAND.jobRef(), 100, 200)))
                .isInstanceOf(GatewayException.class);
            assertThat(server.calls).hasValue(0);
        }
    }

    private void assertUnavailable(VisionOcrAdapter adapter) {
        assertThatThrownBy(() -> adapter.recognize(COMMAND)).isInstanceOf(GatewayException.class)
            .hasCause(null).extracting("code").isEqualTo(GatewayErrorCode.OCR_UNAVAILABLE);
    }
}
