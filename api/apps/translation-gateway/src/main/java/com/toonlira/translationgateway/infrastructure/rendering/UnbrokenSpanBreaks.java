package com.toonlira.translationgateway.infrastructure.rendering;

import java.text.BreakIterator;
import java.text.CharacterIterator;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Line breaks of the target language, except inside a URL, e-mail address or file path: "http://example.com/x" split as
 * "http:" / "//example.com/x" stops being an address. A span wider than the box makes the font shrink instead (the
 * measurer is asked to never split a word), and if it still does not fit the region keeps its original.
 */
final class UnbrokenSpanBreaks extends BreakIterator {
    private static final Pattern UNBROKEN = Pattern.compile(
        "(?i)(?:https?://|www\\.)\\S+"                       // URL
            + "|[\\p{L}\\p{N}._%+-]+@[\\p{L}\\p{N}-]+(?:\\.[\\p{L}\\p{N}-]+)+" // e-mail
            + "|(?:~|\\.{1,2})?(?:/[\\p{L}\\p{N}._-]+){2,}/?");  // path with at least two segments

    private final BreakIterator lines;
    private final List<int[]> spans = new ArrayList<>();

    UnbrokenSpanBreaks(BreakIterator lines) { this.lines = lines; }

    @Override public int first() { return lines.first(); }
    @Override public int last() { return lines.last(); }
    @Override public int current() { return lines.current(); }
    @Override public CharacterIterator getText() { return lines.getText(); }

    @Override
    public void setText(CharacterIterator text) {
        lines.setText(text);
        spans.clear();
        var content = new StringBuilder();
        for (char c = text.first(); c != CharacterIterator.DONE; c = text.next()) content.append(c);
        int begin = text.getBeginIndex();
        var matcher = UNBROKEN.matcher(content);
        while (matcher.find()) {
            // Closing punctuation after an address ("…/ubunchu)." ) may still break away.
            int end = matcher.end();
            while (end > matcher.start() + 1 && ".,;:!?)]}\"'".indexOf(content.charAt(end - 1)) >= 0) end--;
            spans.add(new int[]{begin + matcher.start(), begin + end});
        }
        text.first();
    }

    @Override
    public int next() {
        int at = lines.next();
        while (at != DONE && inside(at)) at = lines.next();
        return at;
    }

    @Override
    public int previous() {
        int at = lines.previous();
        while (at != DONE && inside(at)) at = lines.previous();
        return at;
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
        int at = lines.following(offset);
        while (at != DONE && inside(at)) at = lines.next();
        return at;
    }

    @Override
    public int preceding(int offset) {
        int at = lines.preceding(offset);
        while (at != DONE && inside(at)) at = lines.previous();
        return at;
    }

    @Override
    public boolean isBoundary(int offset) { return lines.isBoundary(offset) && !inside(offset); }

    private boolean inside(int offset) {
        for (var span : spans) if (offset > span[0] && offset < span[1]) return true;
        return false;
    }
}
