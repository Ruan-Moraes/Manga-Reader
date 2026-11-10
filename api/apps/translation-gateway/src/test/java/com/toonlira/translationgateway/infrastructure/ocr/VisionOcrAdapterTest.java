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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(OutputCaptureExtension.class)
class VisionOcrAdapterTest {
    @ParameterizedTest
    @CsvSource({"ja,ja", "en,en", "es,es", "ko,ko", "zh-Hans,zh-Hans", "zh-Hant,zh-Hant", "pt-BR,pt"})
    void sendsVolatileBytesInlineInOneRegionalOnlineRpcWithoutContentUri(String language, String hint) throws Exception {
        var original = new byte[]{1, 2, 3, 4};
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project")) {
            assertThat(adapter.recognize(original, language, COMMAND.jobRef(), 100, 200)).isEmpty();
            assertThat(server.calls).hasValue(1);
            assertThat(server.lastRequest.getParent()).isEqualTo("projects/test-project/locations/us");
            var image = server.lastRequest.getRequests(0);
            assertThat(image.getImage().getContent().toByteArray()).containsExactly(original);
            assertThat(image.getImage().hasSource()).isFalse();
            assertThat(image.getFeatures(0).getType()).isEqualTo(Feature.Type.DOCUMENT_TEXT_DETECTION);
            assertThat(image.getImageContext().getLanguageHintsList()).containsExactly(hint);
            assertThat(original).containsExactly(1, 2, 3, 4);
        }
    }

    @Test
    void inlineFailuresNeverRetryOrRetainRawProviderErrors(CapturedOutput output) throws Exception {
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(2)), "test-project")) {
            server.handler = (request, observer) -> observer.onError(io.grpc.Status.UNAVAILABLE
                .withDescription("private-inline-image-and-text").asRuntimeException());
            assertThatThrownBy(() -> adapter.recognize(new byte[]{1}, "ja", COMMAND.jobRef(), 100, 200))
                .isInstanceOfSatisfying(GatewayException.class, error -> {
                    assertThat(error.code()).isEqualTo(GatewayErrorCode.OCR_UNAVAILABLE);
                    assertThat(error.getCause()).isNull();
                });
            assertThat(server.calls).hasValue(1);
            assertThat(output).doesNotContain("private-inline-image-and-text");
            for (var bytes : new byte[][]{new byte[0], new byte[12 * 1024 * 1024 + 1]})
                assertThatThrownBy(() -> adapter.recognize(bytes, "ja", COMMAND.jobRef(), 100, 200)).isInstanceOf(GatewayException.class);
            assertThatThrownBy(() -> adapter.recognize(new byte[]{1}, "auto", COMMAND.jobRef(), 100, 200)).isInstanceOf(GatewayException.class);
            assertThat(server.calls).hasValue(1);
        }
    }

    @Test
    void inlineBoundsAndOperationAreValidatedBeforeCallingTheProvider() throws Exception {
        try (var server = new FakeVisionServer(); var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(2)), "test-project")) {
            for (var dimensions : new int[][] {{0, 1}, {1, 0}, {12001, 1}, {1, 12001}, {10000, 8001}})
                assertThatThrownBy(() -> adapter.recognize(new byte[]{1}, "ja", COMMAND.jobRef(), dimensions[0], dimensions[1]))
                    .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.OCR_INVALID_MEDIA));
            assertThatThrownBy(() -> adapter.recognize(new byte[]{1}, "ja", null, 100, 200)).isInstanceOf(GatewayException.class);
            assertThatThrownBy(() -> adapter.recognize(null, "ja", COMMAND.jobRef(), 100, 200)).isInstanceOf(GatewayException.class);
            assertThat(server.calls).hasValue(0);
        }
    }

    @Test
    void buildsRegionalGcsRequestAndNeverSendsBytes() throws Exception {
        try (var server = new FakeVisionServer();
             var adapter = new LegacyVisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project", "private-fixtures")) {
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
        assertThat(((com.google.api.gax.core.InstantiatingExecutorProvider) settings.getExecutorProvider()).getExecutorThreadCount()).isEqualTo(2);
        assertThat(settings.getEndpoint()).isEqualTo("us-vision.googleapis.com:443");
        assertThat(settings.batchAnnotateImagesSettings().getRetryableCodes()).isEmpty();
        assertThat(settings.batchAnnotateImagesSettings().getRetrySettings().getMaxAttempts()).isOne();
        assertThat(settings.batchAnnotateImagesSettings().getRetrySettings().getTotalTimeoutDuration()).isEqualTo(Duration.ofSeconds(60));
    }

    @Test
    void neverRetriesTransportFailureAndDoesNotLeakRawErrors(CapturedOutput output) throws Exception {
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(2)), "test-project")) {
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
             var adapter = new VisionOcrAdapter(server.client(Duration.ofMillis(400)), "test-project")) {
            server.handler = (request, observer) -> { /* Accepted, but response lost. */ };
            assertUnavailable(adapter);
            assertThat(server.calls).hasValue(1);
        }
    }

    @Test
    void rejectsEmbeddedProviderErrorAndOversizedTransportResponse() throws Exception {
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project")) {
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
             var adapter = new LegacyVisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project", "private-fixtures")) {
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
        assertThatThrownBy(() -> adapter.recognize(new byte[]{1}, "ja", COMMAND.jobRef(), 100, 200)).isInstanceOf(GatewayException.class)
            .hasCause(null).extracting("code").isEqualTo(GatewayErrorCode.OCR_UNAVAILABLE);
    }

    private void assertUnavailable(LegacyVisionOcrAdapter adapter) {
        assertThatThrownBy(() -> adapter.recognize(COMMAND)).isInstanceOf(GatewayException.class)
            .hasCause(null).extracting("code").isEqualTo(GatewayErrorCode.OCR_UNAVAILABLE);
    }
}
