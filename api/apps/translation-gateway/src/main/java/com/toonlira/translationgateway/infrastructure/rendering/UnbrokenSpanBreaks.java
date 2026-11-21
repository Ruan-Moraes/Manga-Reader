package com.toonlira.translationgateway.infrastructure.rendering;

import java.text.BreakIterator;
import java.text.CharacterIterator;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;
import java.util.regex.Pattern;

/**
 * Line breaks of the target language, except inside a URL, e-mail address or file path: "http://example.com/x" split as
 * "http:" / "//example.com/x" stops being an address. A span wider than the box makes the font shrink instead (the
 * measurer is asked to never split a word), and if it still does not fit the region keeps its original. With a
 * {@link Hyphenator}, the syllable points of each word are break opportunities too (the caller draws the hyphen).
 */
final class UnbrokenSpanBreaks extends BreakIterator {
    private static final Pattern UNBROKEN = Pattern.compile(
        "(?i)(?:https?://|www\\.)\\S+"                       // URL
            + "|[\\p{L}\\p{N}._%+-]+@[\\p{L}\\p{N}-]+(?:\\.[\\p{L}\\p{N}-]+)+" // e-mail
            + "|(?:~|\\.{1,2})?(?:/[\\p{L}\\p{N}._-]+){2,}/?");  // path with at least two segments
    private static final Pattern WORD = Pattern.compile("\\p{L}+");

    private final BreakIterator lines;
    private final Hyphenator hyphenator;
    private CharacterIterator text;
    private int[] boundaries = new int[0];
    private int current;

    UnbrokenSpanBreaks(BreakIterator lines) { this(lines, null); }

    /** {@code hyphenator}: null for whole words only. */
    UnbrokenSpanBreaks(BreakIterator lines, Hyphenator hyphenator) {
        this.lines = lines;
        this.hyphenator = hyphenator;
    }

    @Override public CharacterIterator getText() { return text; }

    @Override
    public void setText(CharacterIterator text) {
        this.text = text;
        lines.setText(text);
        var content = new StringBuilder();
        for (char c = text.first(); c != CharacterIterator.DONE; c = text.next()) content.append(c);
        int begin = text.getBeginIndex();
        var spans = new ArrayList<int[]>();
        var matcher = UNBROKEN.matcher(content);
        while (matcher.find()) {
            // Closing punctuation after an address ("…/ubunchu)." ) may still break away.
            int end = matcher.end();
            while (end > matcher.start() + 1 && ".,;:!?)]}\"'".indexOf(content.charAt(end - 1)) >= 0) end--;
            spans.add(new int[]{begin + matcher.start(), begin + end});
        }
        var all = new TreeSet<Integer>();
        for (int at = lines.first(); at != DONE; at = lines.next()) all.add(at);
        if (hyphenator != null && hyphenator.available()) {
            var words = WORD.matcher(content);
            while (words.find()) for (int point : hyphenator.points(words.group())) all.add(begin + words.start() + point);
        }
        all.removeIf(at -> inside(spans, at));
        boundaries = all.stream().mapToInt(Integer::intValue).toArray();
        current = 0;
        text.first();
    }

    @Override public int first() { current = 0; return boundaries.length == 0 ? DONE : boundaries[0]; }
    @Override public int last() { current = boundaries.length - 1; return current < 0 ? DONE : boundaries[current]; }
    @Override public int current() { return boundaries.length == 0 ? DONE : boundaries[Math.clamp(current, 0, boundaries.length - 1)]; }

    @Override
    public int next() {
        if (current + 1 >= boundaries.length) { current = boundaries.length; return DONE; }
        return boundaries[++current];
    }

    @Override
    public int previous() {
        if (current - 1 < 0) { current = -1; return DONE; }
        return boundaries[--current];
    }

    @Override
    public int next(int n) {
        int at = current();
        for (; n > 0 && at != DONE; n--) at = next();
        for (; n < 0 && at != DONE; n++) at = previous();
        return at;
    }

    @Override
    public int following(int offset) {
        for (int i = 0; i < boundaries.length; i++) if (boundaries[i] > offset) { current = i; return boundaries[i]; }
        current = boundaries.length;
        return DONE;
    }

    @Override
    public int preceding(int offset) {
        for (int i = boundaries.length - 1; i >= 0; i--) if (boundaries[i] < offset) { current = i; return boundaries[i]; }
        current = -1;
        return DONE;
    }

    @Override
    public boolean isBoundary(int offset) {
        for (int boundary : boundaries) if (boundary == offset) { following(offset - 1); return true; }
        following(offset);
        return false;
    }

    private static boolean inside(List<int[]> spans, int offset) {
        for (var span : spans) if (offset > span[0] && offset < span[1]) return true;
        return false;
    }
}
