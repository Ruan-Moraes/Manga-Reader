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

    /** Hand-drawn lettering of a sentence: letters needed with kanji / words needed in spaced scripts. */
    static final int MIN_LETTERING_LETTERS = 8, MIN_LETTERING_WORDS = 3;

    /**
     * Regions the detector does not see as text ({@code unknown}) whose text is nonetheless a sentence: hand-drawn
     * shouts over the art (「ターミナルがあれば全てが上手くいく」). Sound effects stay out: they are short, few-lettered or
     * repetitive, and fail the caption rule or the sentence length.
     */
    public static Set<UUID> letterings(RenderRequest request, Lexicon lexicon, java.util.Map<UUID, String> kinds) {
        int width = request.source().widthPx(), height = request.source().heightPx();
        var glyphs = request.regions().stream().mapToDouble(region -> glyph(region, width, height)).filter(g -> g > 0).sorted().toArray();
        double median = glyphs.length == 0 ? 0 : glyphs[glyphs.length / 2];
        var result = new HashSet<UUID>();
        for (var region : request.regions()) {
            // Not seen as text by the detector, or drawn much bigger than the page's lettering: a shout.
            boolean shout = "unknown".equals(kinds.get(region.id()))
                || median > 0 && glyphs.length >= MIN_REGIONS_FOR_SIZE && glyph(region, width, height) >= SHOUT_SIZE * median;
            if (shout && isLettering(region.sourceText(), region.translatedText(), lexicon)) result.add(region.id());
        }
        return Set.copyOf(result);
    }

    /** Glyph size from which lettering counts as drawn bigger than the page's speech, and regions needed to judge it. */
    static final double SHOUT_SIZE = 1.8;
    static final int MIN_REGIONS_FOR_SIZE = 3;

    /** sqrt(box area / letters) in pixels: comparable between regions of one page, whatever the script. */
    private static double glyph(RenderRequest.Region region, int width, int height) {
        long letters = region.sourceText().codePoints().filter(Character::isLetterOrDigit).count();
        if (letters == 0) return 0;
        double l = 1, t = 1, r = 0, b = 0;
        for (var vertex : region.polygon()) { l = Math.min(l, vertex.x()); r = Math.max(r, vertex.x()); t = Math.min(t, vertex.y()); b = Math.max(b, vertex.y()); }
        return Math.sqrt((r - l) * width * (b - t) * height / letters);
    }

    static boolean isLettering(String source, String translated, Lexicon lexicon) {
        if (!isCaption(source, translated, lexicon)) return false;
        if (unspaced(source)) {
            int[] letters = source.codePoints().filter(Character::isLetter).filter(c -> c != 'ー' && c != '〜' && c != '～').toArray();
            boolean kanji = java.util.Arrays.stream(letters).anyMatch(c -> Character.UnicodeScript.of(c) == Character.UnicodeScript.HAN);
            return kanji && letters.length >= MIN_LETTERING_LETTERS;
        }
        long words = java.util.Arrays.stream(source.split("\\s+")).filter(token -> token.codePoints().anyMatch(Character::isLetter)).distinct().count();
        return words >= MIN_LETTERING_WORDS;
    }

    public static boolean isCaption(String source, String translated, Lexicon lexicon) {
        if (source == null || translated == null || UnchangedText.unchanged(source, translated)) return false;
        if (unspaced(source)) return unspacedCaption(source);
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

    /**
     * Minimum letters of a Japanese/Chinese caption ({@link #unspacedCaption}): with kanji, and in kana only — sound
     * effects are written in kana and are short (ひゅるる, カタカタ), so kana-only text needs more to read as speech.
     */
    static final int MIN_UNSPACED_LETTERS = 4, MIN_KANA_ONLY_LETTERS = 6, MIN_UNSPACED_DISTINCT = 3;
    /** Share of letters that repeat the letter one period earlier: カタカタカタ, ドキドキ. */
    private static final double REPETITION = .8;

    /** Mostly Han/Hiragana/Katakana: written without spaces, so word tokens say nothing. */
    private static boolean unspaced(String text) {
        long letters = 0, cjk = 0;
        for (int c : text.codePoints().toArray()) {
            if (!Character.isLetter(c)) continue;
            letters++;
            var script = Character.UnicodeScript.of(c);
            if (script == Character.UnicodeScript.HAN || script == Character.UnicodeScript.HIRAGANA
                || script == Character.UnicodeScript.KATAKANA) cjk++;
        }
        return letters > 0 && cjk * 2 >= letters;
    }

    /**
     * Scripts without spaces: a caption has at least {@link #MIN_UNSPACED_LETTERS} letters (the long-vowel mark and
     * wave dash aside; {@link #MIN_KANA_ONLY_LETTERS} without any kanji), {@link #MIN_UNSPACED_DISTINCT} different
     * ones, and is not one short unit repeated — sound effects are short (ガチャ, ひゅるる), few-lettered (ドキドキ) or
     * repetitive (カタカタカタカタ).
     */
    static boolean unspacedCaption(String source) {
        int[] letters = source.codePoints().filter(Character::isLetter).filter(c -> c != 'ー' && c != '〜' && c != '～').toArray();
        boolean kanji = java.util.Arrays.stream(letters).anyMatch(c -> Character.UnicodeScript.of(c) == Character.UnicodeScript.HAN);
        if (letters.length < (kanji ? MIN_UNSPACED_LETTERS : MIN_KANA_ONLY_LETTERS)) return false;
        if (java.util.Arrays.stream(letters).distinct().count() < MIN_UNSPACED_DISTINCT) return false;
        for (int period = 1; period <= letters.length / 2; period++) {
            int same = 0;
            for (int i = period; i < letters.length; i++) if (letters[i] == letters[i - period]) same++;
            if (same >= REPETITION * (letters.length - period)) return false;
        }
        return true;
    }
}
