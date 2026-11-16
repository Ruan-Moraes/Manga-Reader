package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.Font;
import java.awt.font.FontRenderContext;
import java.awt.font.LineBreakMeasurer;
import java.awt.font.TextAttribute;
import java.text.AttributedString;
import java.text.BreakIterator;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.junit.jupiter.api.Test;

class UnbrokenSpanBreaksTest {
    @Test
    void addressesAndPathsAreNeverSplitWhileOrdinaryWordsStillBreak() {
        String text = "Veja http://example.com/ubunchu/ch01 ou fale@example.com.br e /usr/local/bin agora.";
        var breaks = boundaries(text);
        assertThat(insideOf(text, "http://example.com/ubunchu/ch01", breaks)).isEmpty();
        assertThat(insideOf(text, "fale@example.com.br", breaks)).isEmpty();
        assertThat(insideOf(text, "/usr/local/bin", breaks)).isEmpty();
        assertThat(breaks).contains(text.indexOf("ou "), text.indexOf("agora"));
    }

    @Test
    void aNarrowBoxPutsTheWholeUrlOnOneLine() {
        String text = "Visite http://www.aerialline.com/comics/ubunchu";
        var attributed = new AttributedString(text);
        var font = new Font(Font.SANS_SERIF, Font.PLAIN, 12);
        attributed.addAttribute(TextAttribute.FONT, font);
        var context = new FontRenderContext(null, true, true);
        float width = (float) font.getStringBounds("http://www.aerialline.com/comics/ubunchu", context).getWidth() + 4;
        var measurer = new LineBreakMeasurer(attributed.getIterator(),
            new UnbrokenSpanBreaks(BreakIterator.getLineInstance(Locale.ROOT)), context);
        var lines = new ArrayList<String>();
        while (measurer.getPosition() < text.length()) {
            int start = measurer.getPosition();
            // Wide enough for the URL, too narrow for the whole sentence.
            var layout = measurer.nextLayout(width, text.length(), true);
            if (layout == null) break;
            lines.add(text.substring(start, measurer.getPosition()).strip());
        }
        assertThat(lines).contains("http://www.aerialline.com/comics/ubunchu");
    }

    private static List<Integer> boundaries(String text) {
        var iterator = new UnbrokenSpanBreaks(BreakIterator.getLineInstance(Locale.ROOT));
        iterator.setText(text);
        var result = new ArrayList<Integer>();
        for (int at = iterator.first(); at != BreakIterator.DONE; at = iterator.next()) result.add(at);
        // following() must agree with next().
        for (int offset = 0; offset < text.length(); offset++) assertThat(result).contains(iterator.following(offset));
        return result;
    }

    private static List<Integer> insideOf(String text, String span, List<Integer> breaks) {
        int start = text.indexOf(span), end = start + span.length();
        return breaks.stream().filter(at -> at > start && at < end).toList();
    }
}
