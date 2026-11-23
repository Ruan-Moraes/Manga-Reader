package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;

/** One complete page per invocation. No production adapter is installed yet. */
public interface TranslationPort {
    TranslationResponse translate(TranslationRequest request);

    /**
     * {@code decided}: terms the page's chapter already translated (source term -> translation), which must come out
     * as decided. Adapters that cannot honour them translate as without.
     */
    default TranslationResponse translate(TranslationRequest request, java.util.Map<String, String> decided) {
        return translate(request);
    }
}
