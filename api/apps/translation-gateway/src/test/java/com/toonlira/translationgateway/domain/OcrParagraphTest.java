package com.toonlira.translationgateway.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OcrParagraphTest {
    private static final List<OcrManifest.Vertex> BOX = List.of(new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.2, .1),
        new OcrManifest.Vertex(.2, .2), new OcrManifest.Vertex(.1, .2));

    @Test
    void paragraphsReadOnlyByGuessingAreLeftOut() {
        var guess = paragraph(word("WE", .30));                       // 瀬尾 浩史 forced into English
        var marks = paragraph(word("@@@@@@@@", .47));                 // no letters at all
        var sure = paragraph(word("BY", .98), word("HIROSHI", .99));
        var oneSure = paragraph(word("Oh", .20), word("no", .95));    // a confident word lifts the mean
        var drawn = paragraph(word("Gadoo", .31), word("top", .52), word("cap", .45), word("flora.", .40)); // lettering read as words
        var unsure = paragraph(word("Something", .45), word("long", .70)); // a sentence read with fair confidence stays
        var unknown = paragraph(word("Eh", Double.NaN));              // no confidence given is not a guess
        assertThat(OcrParagraph.withoutGuesses(List.of(guess, marks, sure, oneSure, drawn, unsure, unknown)))
            .containsExactly(sure, oneSure, unsure, unknown);
    }

    private static OcrParagraph.Word word(String text, double confidence) { return new OcrParagraph.Word(text + " ", BOX, confidence); }

    private static OcrParagraph paragraph(OcrParagraph.Word... words) {
        var text = new StringBuilder();
        for (var word : words) text.append(word.text());
        return new OcrParagraph(new OcrManifest.Region(UUID.randomUUID(), 0, text.toString(), BOX), List.of(words));
    }
}
