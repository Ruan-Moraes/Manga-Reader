package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;

/** One complete page per invocation. No production adapter is installed yet. */
public interface TranslationPort {
    TranslationResponse translate(TranslationRequest request);
}
