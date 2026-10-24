package com.toonlira.translationgateway.infrastructure.translation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.google.cloud.translate.v3.TranslateTextResponse;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import io.grpc.Status;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

@ExtendWith(OutputCaptureExtension.class)
class TranslationGrpcTransportTest {
    private static final Duration DEADLINE = Duration.ofSeconds(5);
    private static final String SECRET = "synthetic-sensitive-source";

    @ParameterizedTest
    @ValueSource(strings = {"zh-Hans", "zh-Hant", "pt-BR"})
    void sendsOneWholePageUsingTheExplicitGlobalModel(String target) throws Exception {
        try (var server = new FakeTranslationServer();
             var adapter = new CloudTranslationAdapter(server.client(DEADLINE), "test-project")) {
            var request = request(target);
            var result = adapter.translate(request);
            assertThat(server.calls).hasValue(1);
            assertThat(server.lastRequest.getParent()).isEqualTo("projects/test-project/locations/global");
            assertThat(server.lastRequest.getModel()).isEqualTo("projects/test-project/locations/global/models/general/translation-llm");
            assertThat(server.lastRequest.getMimeType()).isEqualTo("text/html");
            assertThat(server.lastRequest.getSourceLanguageCode()).isEqualTo("en");
            assertThat(server.lastRequest.getTargetLanguageCode()).isEqualTo(target);
            assertThat(server.lastRequest.getContentsCount()).isOne();
            assertThat(server.lastRequest.getContents(0)).contains("&lt;opaque&gt;", SECRET)
                .doesNotContain(request.jobRef().toString());
            assertThat(result.regions()).extracting(region -> region.id())
                .containsExactly(request.regions().get(0).id(), request.regions().get(1).id());
            assertThat(result.regions()).extracting(region -> region.translatedText())
                .containsExactly("first <opaque> & " + SECRET, "second 漢字 😀\nline");
        }
    }

    @Test
    void unavailableDoesNotRetryOrLeakTheRawResponse(CapturedOutput output) throws Exception {
        try (var server = new FakeTranslationServer();
             var adapter = new CloudTranslationAdapter(server.client(DEADLINE), "test-project")) {
            server.handler = (request, observer) -> observer.onError(Status.UNAVAILABLE
                .withDescription(SECRET).asRuntimeException());
            assertCode(() -> adapter.translate(request("pt-BR")), GatewayErrorCode.TRANSLATION_UNAVAILABLE);
            assertThat(server.calls).hasValue(1);
            assertThat(output).doesNotContain(SECRET);
        }
    }

    @Test
    void acceptedButUnansweredCallTimesOutWithoutAnotherAttempt() throws Exception {
        try (var server = new FakeTranslationServer();
             var adapter = new CloudTranslationAdapter(server.client(Duration.ofSeconds(1)), "test-project")) {
            server.handler = (request, observer) -> { /* Accepted response intentionally withheld. */ };
            assertCode(() -> adapter.translate(request("pt-BR")), GatewayErrorCode.TRANSLATION_UNAVAILABLE);
            assertThat(server.calls).hasValue(1);
        }
    }

    @Test
    void invalidResponseFailsWithoutRetryOrModelFallback() throws Exception {
        try (var server = new FakeTranslationServer();
             var adapter = new CloudTranslationAdapter(server.client(DEADLINE), "test-project")) {
            server.handler = (request, observer) -> {
                var response = TranslateTextResponse.newBuilder();
                response.addTranslationsBuilder().setModel("projects/test-project/locations/global/models/general/nmt")
                    .setTranslatedText(request.getContents(0));
                observer.onNext(response.build());
                observer.onCompleted();
            };
            assertCode(() -> adapter.translate(request("pt-BR")), GatewayErrorCode.TRANSLATION_INVALID_RESPONSE);
            assertThat(server.calls).hasValue(1);
        }
    }

    @Test
    void oversizedTransportResponseFailsWithoutRetry() throws Exception {
        try (var server = new FakeTranslationServer();
             var adapter = new CloudTranslationAdapter(server.client(DEADLINE), "test-project")) {
            server.handler = (request, observer) -> {
                var response = TranslateTextResponse.newBuilder();
                response.addTranslationsBuilder().setModel(request.getModel())
                    .setTranslatedText("x".repeat(TranslationClientFactory.MAX_RESPONSE_BYTES + 1));
                observer.onNext(response.build());
                observer.onCompleted();
            };
            assertCode(() -> adapter.translate(request("pt-BR")), GatewayErrorCode.TRANSLATION_UNAVAILABLE);
            assertThat(server.calls).hasValue(1);
        }
    }

    @Test
    void emptyOrOversizedInputNeverReachesTheTransport() throws Exception {
        try (var server = new FakeTranslationServer();
             var adapter = new CloudTranslationAdapter(server.client(DEADLINE), "test-project")) {
            var pair = new LanguagePair("en", "pt-BR");
            assertThat(adapter.translate(new TranslationRequest(UUID.randomUUID(), pair, List.of())).regions()).isEmpty();
            var regions = IntStream.range(0, 8)
                .mapToObj(index -> new TranslationRequest.Region(UUID.randomUUID(), index, "x".repeat(4096))).toList();
            assertCode(() -> adapter.translate(new TranslationRequest(UUID.randomUUID(), pair, regions)),
                GatewayErrorCode.TRANSLATION_INVALID_REQUEST);
            assertThat(server.calls).hasValue(0);
        }
    }

    private static TranslationRequest request(String target) {
        return new TranslationRequest(UUID.randomUUID(), new LanguagePair("en", target), List.of(
            new TranslationRequest.Region(UUID.randomUUID(), 0, "first <opaque> & " + SECRET),
            new TranslationRequest.Region(UUID.randomUUID(), 1, "second 漢字 😀\nline")));
    }

    private static void assertCode(Runnable action, GatewayErrorCode expected) {
        assertThatThrownBy(action::run).isInstanceOfSatisfying(GatewayException.class, error -> {
            assertThat(error.code()).isEqualTo(expected);
            assertThat(error.getCause()).isNull();
            assertThat(error.getMessage()).doesNotContain(SECRET);
        });
    }
}
