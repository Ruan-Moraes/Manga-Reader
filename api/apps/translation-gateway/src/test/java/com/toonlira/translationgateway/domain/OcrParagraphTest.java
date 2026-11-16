package com.toonlira.translationgateway.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OcrParagraphTest {
    private static final List<OcrManifest.Vertex> BOX = List.of(new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.2, .1),
        new OcrManifest.Vertex(.2, .2), new OcrManifest.Vertex(.1, .2));

    @Test
    void shortParagraphsReadOnlyByGuessingAreLeftOut() {
        var guess = paragraph(word("WE", .30));                       // 瀬尾 浩史 forced into English
        var marks = paragraph(word("@@@@@@@@", .47));                 // no letters at all
        var sure = paragraph(word("BY", .98), word("HIROSHI", .99));
        var oneSure = paragraph(word("Oh", .20), word("no", .95));    // one confident word is enough to keep it
        var longGuess = paragraph(word("Something", .40), word("long", .40)); // too long to be a stray guess
        var unknown = paragraph(word("Eh", Double.NaN));              // no confidence given is not a guess
        assertThat(OcrParagraph.withoutGuesses(List.of(guess, marks, sure, oneSure, longGuess, unknown)))
            .containsExactly(sure, oneSure, longGuess, unknown);
    }

    private static OcrParagraph.Word word(String text, double confidence) { return new OcrParagraph.Word(text + " ", BOX, confidence); }

    private static OcrParagraph paragraph(OcrParagraph.Word... words) {
        var text = new StringBuilder();
        for (var word : words) text.append(word.text());
        return new OcrParagraph(new OcrManifest.Region(UUID.randomUUID(), 0, text.toString(), BOX), List.of(words));
    }
}
