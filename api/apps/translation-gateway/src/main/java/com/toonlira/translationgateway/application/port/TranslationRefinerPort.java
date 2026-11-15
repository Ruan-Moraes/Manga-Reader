package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;

/**
 * Optional language layer over one translated page: may correct doubtful OCR readings from the page context and
 * revise the machine translation, region by region. Text only; the image never reaches it. Any exception means
 * "no review": the caller keeps the machine translation it passed in.
 */
public interface TranslationRefinerPort {
    /** The layer switched off: the machine translation goes to rendering as is. */
    TranslationRefinerPort NONE = (request, translated) -> translated;

    /** Same regions, same ids, same order as {@code translated}. */
    TranslationResponse refine(TranslationRequest request, TranslationResponse translated);
}
