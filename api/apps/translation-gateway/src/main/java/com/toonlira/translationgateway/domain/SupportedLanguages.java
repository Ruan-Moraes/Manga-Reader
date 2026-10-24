package com.toonlira.translationgateway.domain;

import java.util.List;

public final class SupportedLanguages {
    public static final List<String> CODES = List.of("ja", "en", "es", "ko", "zh-Hans", "zh-Hant", "pt-BR");

    private SupportedLanguages() { }

    public static boolean contains(String code) { return code != null && CODES.contains(code); }
}
