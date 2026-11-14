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
    private static final Pattern REGION = Pattern.compile("<p data-region=\"([0-9a-f-]{36})\">((?:[^<>]++|<span translate=\"no\">[^<>]*+</span>)*+)</p>", Pattern.DOTALL);
    private static final Pattern SPAN_TAGS = Pattern.compile("<span translate=\"no\">|</span>");
    /**
     * The provider treats a protected span as a separate token and pads it with spaces ("Ubuntu !", "( Ubuntu"),
     * which pt-BR/es/en typography never uses before closing or after opening punctuation.
     */
    private static final Pattern SPACE_AFTER_SPAN = Pattern.compile("</span>[ \\u00A0]+(?=[!?.,;:…)\\]}»”’])");
    private static final Pattern SPACE_BEFORE_SPAN = Pattern.compile("(?<=[(\\[{«“‘])[ \\u00A0]+<span translate=\"no\">");
    private final ProtectedTerms terms = new ProtectedTerms();
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
                .append(terms.wrap(region.sourceText(), StringEscapeUtils::escapeHtml4)).append("</p>");
        }
        html.append("</div>");
        String content = html.toString();
        if (content.codePointCount(0, content.length()) > MAX_PROVIDER_CODEPOINTS) {
            throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_REQUEST, 422, false);
        }
        return content;
    }

    /**
     * Regions whose protected literals did not survive translation fall back to their source text, so a product name
     * or URL is never silently altered; the renderer then keeps the original art for text it cannot draw.
     */
    boolean isLiteralOnly(String text) { return terms.isLiteralOnly(text); }

    TranslationResponse restoreProtected(TranslationRequest request, TranslationResponse translated) {
        var source = new java.util.HashMap<UUID, String>();
        for (var region : request.regions()) source.put(region.id(), region.sourceText());
        var regions = new ArrayList<TranslationResponse.Region>();
        for (var region : translated.regions()) {
            String original = source.get(region.id());
            boolean lost = original != null && terms.find(original).stream().anyMatch(term -> !region.translatedText().contains(term));
            regions.add(lost ? new TranslationResponse.Region(region.id(), original) : region);
        }
        return new TranslationResponse(regions);
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
            var body = SPACE_AFTER_SPAN.matcher(matcher.group(2)).replaceAll("</span>");
            body = SPACE_BEFORE_SPAN.matcher(body).replaceAll("<span translate=\"no\">");
            regions.add(new TranslationResponse.Region(id, StringEscapeUtils.unescapeHtml4(SPAN_TAGS.matcher(body).replaceAll(""))));
            offset = matcher.end();
        }
        if (!inner.substring(offset).isBlank()) invalid();
        return new TranslationResponse(regions);
    }

    private static void invalid() {
        throw new GatewayException(GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, 422, false);
    }
}
