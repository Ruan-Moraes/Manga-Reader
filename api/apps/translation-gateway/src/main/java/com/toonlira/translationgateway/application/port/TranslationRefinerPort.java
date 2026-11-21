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

    /**
     * Review of a page of a chapter: {@code glossary} holds the names the chapter already translated (source -> translation),
     * which the review keeps; the review reports the proper names it used on this page, for the next ones. A layer that
     * does not track names reviews as without a chapter and reports none.
     */
    default Review refine(TranslationRequest request, TranslationResponse translated, java.util.Map<String, String> glossary) {
        return new Review(refine(request, translated), java.util.Map.of());
    }

    /** {@code names}: proper names of the page as the review translated them (source -> translation). */
    record Review(TranslationResponse response, java.util.Map<String, String> names) {
        public Review { names = java.util.Map.copyOf(names); }
    }
}
