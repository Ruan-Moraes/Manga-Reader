package com.toonlira.translationgateway.infrastructure.translation;

import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidationException;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import java.util.ArrayList;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import org.apache.commons.text.StringEscapeUtils;

/** One HTML document keeps page context while opaque tags carry region identities. */
final class TranslationEnvelopeCodec {
    static final int MAX_PROVIDER_CODEPOINTS = 30_000;
    private static final Pattern REGION = Pattern.compile("<p data-region=\"([0-9a-f-]{36})\">([^<>]*)</p>", Pattern.DOTALL);
    private static final TranslationValidator CONTRACT = new TranslationValidator(Set.copyOf(LanguagePair.all()));

    String encode(TranslationRequest request) {
        try {
            CONTRACT.validateRequest(request);
        } catch (TranslationValidationException error) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_REQUEST, 422, false);
        }
        var html = new StringBuilder("<div>");
        for (var region : request.regions()) {
            html.append("<p data-region=\"").append(region.id()).append("\">")
                .append(StringEscapeUtils.escapeHtml4(region.sourceText())).append("</p>");
        }
        html.append("</div>");
        String content = html.toString();
        if (content.codePointCount(0, content.length()) > MAX_PROVIDER_CODEPOINTS) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_REQUEST, 422, false);
        }
        return content;
    }

    TranslationResponse decode(String translatedHtml) {
        if (translatedHtml == null || !translatedHtml.startsWith("<div>") || !translatedHtml.endsWith("</div>")) invalid();
        var inner = translatedHtml.substring(5, translatedHtml.length() - 6);
        var matcher = REGION.matcher(inner);
        var regions = new ArrayList<TranslationResponse.Region>();
        int offset = 0;
        while (matcher.find()) {
            if (!inner.substring(offset, matcher.start()).isBlank()) invalid();
            UUID id;
            try {
                id = UUID.fromString(matcher.group(1));
            } catch (IllegalArgumentException error) {
                throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, 422, false);
            }
            regions.add(new TranslationResponse.Region(id, StringEscapeUtils.unescapeHtml4(matcher.group(2))));
            offset = matcher.end();
        }
        if (!inner.substring(offset).isBlank()) invalid();
        return new TranslationResponse(regions);
    }

    private static void invalid() {
        throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, 422, false);
    }
}
