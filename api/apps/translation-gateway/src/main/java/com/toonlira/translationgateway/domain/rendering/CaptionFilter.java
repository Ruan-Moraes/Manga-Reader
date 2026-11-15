package com.toonlira.translationgateway.domain.rendering;

import com.toonlira.translationgateway.domain.ocr.Lexicon;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Tells speech and captions apart from sound effects, so only the former are erased from artwork and retyped.
 * A caption: the translation changes the text, it has at least two different word tokens, and (when a word list
 * exists for the source language) most of them are words of the language. Repeated tokens ("clatter clatter"),
 * single words and non-words keep their hand-drawn lettering.
 */
public final class CaptionFilter {
    private static final double MIN_KNOWN = .6;

    private CaptionFilter() { }

    public static Set<UUID> captions(RenderRequest request, Lexicon lexicon) {
        return captions(request, lexicon, java.util.Map.of());
    }

    /**
     * {@code kinds}: detector class per region (layout 1.2), possibly empty. A region the detector does not see as
     * text at all ({@code unknown}: stylized sound effects such as "FREEK" or "clatter") is never a caption, whatever
     * the word list says: its hand-drawn lettering stays. Text boxes ({@code text_bubble}, {@code text_free}) and
     * regions without a class follow the word-list rule.
     */
    public static Set<UUID> captions(RenderRequest request, Lexicon lexicon, java.util.Map<UUID, String> kinds) {
        var result = new HashSet<UUID>();
        for (var region : request.regions()) {
            if ("unknown".equals(kinds.get(region.id()))) continue;
            if (isCaption(region.sourceText(), region.translatedText(), lexicon)) result.add(region.id());
        }
        return Set.copyOf(result);
    }

    public static boolean isCaption(String source, String translated, Lexicon lexicon) {
        if (source == null || translated == null || UnchangedText.unchanged(source, translated)) return false;
        var tokens = new java.util.ArrayList<String>();
        for (var token : source.split("\\s+")) {
            var core = Lexicon.core(token);
            if (!core.isEmpty() && core.codePoints().anyMatch(Character::isLetter)) tokens.add(core.toLowerCase(Locale.ROOT));
        }
        if (tokens.size() < 2 || new HashSet<>(tokens).size() < 2) return false;
        if (!lexicon.available()) return true;
        long known = tokens.stream().filter(lexicon::knows).count();
        return known >= MIN_KNOWN * tokens.size();
    }
}
