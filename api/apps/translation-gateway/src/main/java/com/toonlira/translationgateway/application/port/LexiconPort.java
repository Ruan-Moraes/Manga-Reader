package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.ocr.Lexicon;

public interface LexiconPort {
    /** Word list of a source language, or {@link Lexicon#NONE} (CJK and languages without a bundled list). */
    Lexicon forLanguage(String sourceLanguage);
}
