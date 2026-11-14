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
    /** The provider echoes the project NUMBER in `model`, even when the request used the project ID. */
    private static final Pattern RESPONSE_MODEL =
        Pattern.compile("projects/(?:[a-z][a-z0-9-]{4,28}[a-z0-9]|[0-9]{6,20})/locations/global/models/general/translation-llm");

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
        // Literal-only regions (numbers, URLs, product names) never go to the provider; they keep their text.
        var sendable = request.regions().stream().filter(region -> !codec.isLiteralOnly(region.sourceText())).toList();
        if (sendable.size() == request.regions().size()) return translateAll(request);
        var reindexed = new java.util.ArrayList<TranslationRequest.Region>();
        for (var region : sendable) reindexed.add(new TranslationRequest.Region(region.id(), reindexed.size(), region.sourceText()));
        var translated = new java.util.HashMap<java.util.UUID, String>();
        if (!reindexed.isEmpty()) {
            for (var region : translateAll(new TranslationRequest(request.jobRef(), request.pair(), reindexed)).regions()) {
                translated.put(region.id(), region.translatedText());
            }
        }
        var merged = request.regions().stream().map(region -> new TranslationResponse.Region(
            region.id(), translated.getOrDefault(region.id(), region.sourceText()))).toList();
        return new TranslationResponse(merged);
    }

    private TranslationResponse translateAll(TranslationRequest request) {
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
            || !RESPONSE_MODEL.matcher(response.getTranslations(0).getModel()).matches()) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, 422, false);
        }
        try {
            var translated = codec.decode(response.getTranslations(0).getTranslatedText());
            validator.validateResponse(request, translated);
            return codec.restoreProtected(request, translated);
        } catch (TranslationValidationException error) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, 422, false);
        }
    }

    @Override
    public void close() { client.close(); }
}
