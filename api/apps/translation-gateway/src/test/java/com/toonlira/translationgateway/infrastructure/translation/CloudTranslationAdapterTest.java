package com.toonlira.translationgateway.infrastructure.translation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.google.cloud.translate.v3.TranslateTextRequest;
import com.google.cloud.translate.v3.TranslateTextResponse;
import com.google.cloud.translate.v3.TranslationServiceClient;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class CloudTranslationAdapterTest {
    private static final UUID FIRST = UUID.fromString("550e8400-e29b-41d4-a716-446655440001");
    private static final UUID SECOND = UUID.fromString("550e8400-e29b-41d4-a716-446655440002");
    private static final String MODEL = "projects/test-project/locations/global/models/general/translation-llm";

    @Test
    void sendsOneContextualGlobalRequestWithOpaqueIdsAndPreservesChineseVariants() {
        var client = mock(TranslationServiceClient.class);
        var request = request("zh-Hant", "zh-Hans");
        when(client.translateText(any(TranslateTextRequest.class))).thenReturn(response(
            "<div><p data-region=\"" + SECOND + "\">第二</p><p data-region=\"" + FIRST + "\">第一 &amp; &lt;安全&gt;</p></div>"));

        var result = new CloudTranslationAdapter(client, "test-project").translate(request);

        var capture = ArgumentCaptor.forClass(TranslateTextRequest.class);
        verify(client, times(1)).translateText(capture.capture());
        var rpc = capture.getValue();
        assertThat(rpc.getParent()).isEqualTo("projects/test-project/locations/global");
        assertThat(rpc.getModel()).isEqualTo(MODEL);
        assertThat(rpc.getSourceLanguageCode()).isEqualTo("zh-Hant");
        assertThat(rpc.getTargetLanguageCode()).isEqualTo("zh-Hans");
        assertThat(rpc.getMimeType()).isEqualTo("text/html");
        assertThat(rpc.getContentsCount()).isOne();
        assertThat(rpc.getContents(0)).contains("data-region=\"" + FIRST + "\"", "data-region=\"" + SECOND + "\"")
            .contains("&lt;unsafe&gt;").doesNotContain("<unsafe>");
        assertThat(result.regions()).extracting(region -> region.id()).containsExactly(SECOND, FIRST);
        assertThat(result.regions().get(1).translatedText()).isEqualTo("第一 & <安全>");
    }

    @Test
    void rejectsOversizedWholeRequestBeforeCallingProvider() {
        var client = mock(TranslationServiceClient.class);
        var regions = java.util.stream.IntStream.range(0, 15).mapToObj(index ->
            new TranslationRequest.Region(UUID.randomUUID(), index, "x".repeat(4096))).toList();
        var request = new TranslationRequest(UUID.randomUUID(), new LanguagePair("ja", "pt-BR"), regions);

        assertCode(() -> new CloudTranslationAdapter(client, "test-project").translate(request),
            GatewayErrorCode.TRANSLATION_INVALID_REQUEST);
        verify(client, times(0)).translateText(any(TranslateTextRequest.class));
    }

    @Test
    void mapsTransportFailureWithoutRetryOrRawMessage() {
        var client = mock(TranslationServiceClient.class);
        when(client.translateText(any(TranslateTextRequest.class)))
            .thenThrow(new IllegalStateException("sensitive provider response"));
        var adapter = new CloudTranslationAdapter(client, "test-project");

        assertThatThrownBy(() -> adapter.translate(request("ja", "pt-BR")))
            .isInstanceOfSatisfying(GatewayException.class, error -> {
                assertThat(error.code()).isEqualTo(GatewayErrorCode.TRANSLATION_UNAVAILABLE);
                assertThat(error.getMessage()).doesNotContain("sensitive");
                assertThat(error.getCause()).isNull();
            });
        verify(client, times(1)).translateText(any(TranslateTextRequest.class));
    }

    @Test
    void rejectsMissingDuplicateOrMalformedMarkersAndModelFallback() {
        var client = mock(TranslationServiceClient.class);
        var adapter = new CloudTranslationAdapter(client, "test-project");
        var request = request("ja", "pt-BR");
        for (var text : List.of(
            "<div><p data-region=\"" + FIRST + "\">Only one</p></div>",
            "<div><p data-region=\"" + FIRST + "\">A</p><p data-region=\"" + FIRST + "\">B</p></div>",
            "<div><script>bad</script></div>")) {
            when(client.translateText(any(TranslateTextRequest.class))).thenReturn(response(text));
            assertCode(() -> adapter.translate(request), GatewayErrorCode.TRANSLATION_INVALID_RESPONSE);
        }
        var fallback = TranslateTextResponse.newBuilder();
        fallback.addTranslationsBuilder().setModel("projects/test-project/locations/global/models/general/nmt")
            .setTranslatedText("<div></div>");
        when(client.translateText(any(TranslateTextRequest.class))).thenReturn(fallback.build());
        assertCode(() -> adapter.translate(request), GatewayErrorCode.TRANSLATION_INVALID_RESPONSE);
    }

    @Test
    void doesNotCallProviderForAnEmptyPage() {
        var client = mock(TranslationServiceClient.class);
        var request = new TranslationRequest(UUID.randomUUID(), new LanguagePair("en", "pt-BR"), List.of());
        assertThat(new CloudTranslationAdapter(client, "test-project").translate(request).regions()).isEmpty();
        verify(client, times(0)).translateText(any(TranslateTextRequest.class));
    }

    @Test
    void settingsPinGlobalEndpointAndOneAttempt() {
        var settings = TranslationClientFactory.settings();
        assertThat(settings.getEndpoint()).isEqualTo(CloudTranslationAdapter.ENDPOINT);
        assertThat(settings.translateTextSettings().getRetryableCodes()).isEmpty();
        assertThat(settings.translateTextSettings().getRetrySettings().getMaxAttempts()).isOne();
        assertThat(settings.translateTextSettings().getRetrySettings().getTotalTimeoutDuration())
            .isEqualTo(TranslationClientFactory.DEADLINE);
    }

    private static TranslationRequest request(String source, String target) {
        return new TranslationRequest(UUID.randomUUID(), new LanguagePair(source, target), List.of(
            new TranslationRequest.Region(FIRST, 0, "first <unsafe>"),
            new TranslationRequest.Region(SECOND, 1, "second")));
    }

    private static TranslateTextResponse response(String translatedText) {
        var response = TranslateTextResponse.newBuilder();
        response.addTranslationsBuilder().setModel(MODEL).setTranslatedText(translatedText);
        return response.build();
    }

    private static void assertCode(Runnable action, GatewayErrorCode expected) {
        assertThatThrownBy(action::run).isInstanceOfSatisfying(GatewayException.class,
            error -> assertThat(error.code()).isEqualTo(expected));
    }
}
