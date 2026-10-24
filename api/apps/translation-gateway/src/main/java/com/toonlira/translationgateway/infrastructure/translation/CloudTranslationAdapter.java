package com.toonlira.translationgateway.infrastructure.translation;

import com.google.cloud.translate.v3.TranslateTextRequest;
import com.google.cloud.translate.v3.TranslateTextResponse;
import com.google.cloud.translate.v3.TranslationServiceClient;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidationException;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/** One billable call for one whole page; malformed responses never become partial translations. */
public final class CloudTranslationAdapter implements TranslationPort, AutoCloseable {
    static final String ENDPOINT = "translate.googleapis.com:443";
    private static final Pattern PROJECT = Pattern.compile("[a-z][a-z0-9-]{4,28}[a-z0-9]");

    private final TranslationServiceClient client;
    private final String parent;
    private final String model;
    private final TranslationEnvelopeCodec codec = new TranslationEnvelopeCodec();
    private final TranslationValidator validator = new TranslationValidator(Set.copyOf(LanguagePair.all()));

    public CloudTranslationAdapter(TranslationServiceClient client, String projectId) {
        if (client == null || projectId == null || !PROJECT.matcher(projectId).matches()) {
            throw new IllegalArgumentException("Invalid translation configuration");
        }
        this.client = client;
        this.parent = "projects/" + projectId + "/locations/global";
        this.model = parent + "/models/general/translation-llm";
    }

    @Override
    public TranslationResponse translate(TranslationRequest request) {
        var content = codec.encode(request);
        if (request.regions().isEmpty()) return new TranslationResponse(List.of());
        var rpc = TranslateTextRequest.newBuilder().setParent(parent).setModel(model)
            .setMimeType("text/html").setSourceLanguageCode(request.pair().source())
            .setTargetLanguageCode(request.pair().target()).addContents(content).build();
        TranslateTextResponse response;
        try {
            response = client.translateText(rpc);
        } catch (RuntimeException error) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_UNAVAILABLE, 503, false);
        }
        if (response == null || response.getTranslationsCount() != 1
            || !response.getTranslations(0).getModel().equals(model)) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, 422, false);
        }
        try {
            var translated = codec.decode(response.getTranslations(0).getTranslatedText());
            validator.validateResponse(request, translated);
            return translated;
        } catch (TranslationValidationException error) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, 422, false);
        }
    }

    @Override
    public void close() { client.close(); }
}
