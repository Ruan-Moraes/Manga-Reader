package com.toonlira.translationgateway.domain.ocr;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrParagraph;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OcrRereadTest {
    private static final Lexicon EN = new Lexicon(Set.of("windows", "is", "so", "pathetic", "the", "chosen", "you", "are", "annoying"));
    private static final List<OcrManifest.Vertex> BOX = List.of(new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.3, .1),
        new OcrManifest.Vertex(.3, .2), new OcrManifest.Vertex(.1, .2));

    private static OcrReread.Reading reading(String text, double confidence) { return new OcrReread.Reading(text, confidence); }

    @Test
    void agreeingVariantsThatFormRealWordsReplaceAConfusedReading() {
        var chosen = OcrReread.choose(reading("WINDOWS 15 50 PATHETIC!", .62), List.of(
            reading("WINDOWS IS SO PATHETIC!", .96), reading("WINDOWS IS SO PATHETIC!", .94), reading("WINDOWS 15 SO PATHETIC!", .8)), EN);
        assertThat(chosen).isEqualTo("WINDOWS IS SO PATHETIC!");
    }

    @Test
    void wordsBeatANumberWhenVariantsSplitButARealNumberIsKept() {
        // Measured on a real page: 4 of 8 variants read "ARE SO", the rest repeated "ARE 50".
        assertThat(OcrReread.choose(reading("ARE 50", .78), List.of(reading("ARE SO", .91), reading("ARE SO", .92),
            reading("ARE 50", .85), reading("ARE SO", .81)), EN)).isEqualTo("ARE SO");
        // No variant reads letters there: the number stays.
        assertThat(OcrReread.choose(reading("THE CHOSEN 5", .7), List.of(reading("THE CHOSEN 5", .9),
            reading("THE CHOSEN 5", .92), reading("THE CHOSEN 5", .88), reading("THE CHOSEN 5", .9)), EN)).isEqualTo("THE CHOSEN 5");
    }

    @Test
    void aSingleDissentingVariantNeverWins() {
        assertThat(OcrReread.choose(reading("THE CHOSEN 5", .7), List.of(
            reading("THE CHOSEN S", .9), reading("THE CHOSEN 5", .9), reading("THE CHOSEN 5", .88)), EN)).isEqualTo("THE CHOSEN 5");
    }

    @Test
    void readingsThatPulledInNeighbouringTextOrAddNothingAreRejected() {
        assertThat(OcrReread.choose(reading("ARE 50", .6), List.of(
            reading("YOU LINUX FREAKS ARE SO ANNOYING! clatter clatter", .95),
            reading("YOU LINUX FREAKS ARE SO ANNOYING! clatter clatter", .95)), EN)).isEqualTo("ARE 50");
        assertThat(OcrReread.choose(reading("ARE SO", .9), List.of(), EN)).isEqualTo("ARE SO");
    }

    @Test
    void readingsThatDifferOnlyInSpacingNeverReplaceTheOriginal() {
        assertThat(OcrReread.choose(reading("I'M JUST SAYING, WHY", .7), List.of(
            reading("I'M JUST SAYING , WHY", .97), reading("I'M JUST SAYING , WHY", .97), reading("I'M JUST SAYING , WHY", .96)),
            EN)).isEqualTo("I'M JUST SAYING, WHY");
    }

    @Test
    void withoutDictionaryAgreementAndConfidenceStillDecide() {
        assertThat(OcrReread.choose(reading("ナルトだ", .5), List.of(reading("ナルトだ！", .97), reading("ナルトだ！", .95)),
            Lexicon.NONE)).isEqualTo("ナルトだ！");
    }

    @Test
    void suspectsAreLowConfidenceOrNonWordsMostDoubtfulFirstAndCapped() {
        var sure = paragraph(new OcrParagraph.Word("WINDOWS ", BOX, .99), new OcrParagraph.Word("PATHETIC!", BOX, .98));
        var confused = paragraph(new OcrParagraph.Word("WINDOWS ", BOX, .9), new OcrParagraph.Word("15 ", BOX, .55),
            new OcrParagraph.Word("50 ", BOX, .6), new OcrParagraph.Word("PATHETIC!", BOX, .95));
        var nonWord = paragraph(new OcrParagraph.Word("ANN0YING", BOX, .97));
        var noGeometry = paragraph();
        var all = List.of(sure, confused, nonWord, noGeometry);
        assertThat(OcrReread.suspects(all, EN, 8)).containsExactly(1, 2);
        assertThat(OcrReread.suspects(all, EN, 1)).containsExactly(1);
        assertThat(OcrReread.suspects(all, Lexicon.NONE, 8)).containsExactly(1);
        assertThat(OcrReread.suspects(all, EN, 0)).isEmpty();
    }

    @Test
    void lexiconIgnoresCaseNumbersAndPunctuationAndSplitsContractions() {
        var lexicon = new Lexicon(Set.of("don", "t", "i", "m", "olá"));
        assertThat(lexicon.knows(Lexicon.core("DON'T!"))).isTrue();
        assertThat(lexicon.knows(Lexicon.core("I’M"))).isTrue();
        assertThat(lexicon.knows(Lexicon.core("Olá,"))).isTrue();
        assertThat(Lexicon.core("2009")).isEmpty();
        assertThat(lexicon.knows(Lexicon.core("D0N'T"))).isFalse();
    }

    private static OcrParagraph paragraph(OcrParagraph.Word... words) {
        var text = new StringBuilder();
        for (var word : words) text.append(word.text());
        return new OcrParagraph(new OcrManifest.Region(UUID.randomUUID(), 0, text.isEmpty() ? "x" : text.toString(), BOX), List.of(words));
    }

    @Test
    void textTheProviderMissedIsRecoveredOnlyWhenConfidentVariantsAgreeOnLetters() {
        var waai = new OcrReread.Reading("わーい", .97);
        assertThat(OcrReread.recover(List.of(waai, new OcrReread.Reading("わ\nーい", .95), new OcrReread.Reading("1", .67))))
            .isEqualTo(waai);
        // One variant alone, punctuation or ellipses only, or unsure words: nothing is invented.
        assertThat(OcrReread.recover(List.of(waai, new OcrReread.Reading("0000", .82)))).isNull();
        assertThat(OcrReread.recover(List.of(new OcrReread.Reading("!", .98), new OcrReread.Reading("!", .97)))).isNull();
        assertThat(OcrReread.recover(List.of(new OcrReread.Reading("……", .9), new OcrReread.Reading("……", .9)))).isNull();
        assertThat(OcrReread.recover(List.of(new OcrReread.Reading("つ", .67), new OcrReread.Reading("つ", .7)))).isNull();
    }
}
