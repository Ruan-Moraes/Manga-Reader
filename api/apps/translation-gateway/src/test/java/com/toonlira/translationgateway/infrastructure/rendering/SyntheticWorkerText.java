package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.SupportedLanguages;
import java.util.List;

/** Synthetic BMP text only; exact fixture length is not truncation/normalization of provider output. */
final class SyntheticWorkerText {
    private SyntheticWorkerText() { }
    static List<String> languages() { return SupportedLanguages.CODES; }
    static String sourceLanguage(String target) { validate(target); return target.equals("en") ? "pt-BR" : "en"; }

    static String text(String language, int length) {
        validate(language);
        if (length < 0 || length > 8192) invalid();
        var seed = switch (language) {
            case "ja" -> "漢字かなカナ。\n";
            case "en" -> "Hello, comic text.\n";
            case "es" -> "Hola, acción y café.\n";
            case "ko" -> "한글 문장입니다.\n";
            case "zh-Hans" -> "简体中文测试，。\n";
            case "zh-Hant" -> "繁體中文測試，。\n";
            case "pt-BR" -> "Olá, ação e café.\n";
            default -> throw new IllegalStateException("synthetic-worker-text-invalid");
        };
        var text = new StringBuilder(length);
        for (int index = 0; index < length; index++) text.append(seed.charAt(index % seed.length()));
        return text.toString();
    }

    private static void validate(String language) { if (!SupportedLanguages.contains(language)) invalid(); }
    private static void invalid() { throw new IllegalStateException("synthetic-worker-text-invalid"); }
}
