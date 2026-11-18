package com.toonlira.translationgateway.domain.translation;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.domain.ocr.Lexicon;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ChapterTermsTest {
    // Stand-in for lexicon/en.txt: the rule reads the language's own word list, never a list of names.
    private static final Lexicon EN = new Lexicon(Set.of("basil", "defies", "death", "with", "this", "potion", "my",
        "here", "is", "the", "mayor", "wins", "thanks", "fresh"));

    @Test
    void aDictionaryWordCapitalisedMidSentenceAndNeverInLowerCaseIsAName() {
        var names = ChapterTerms.candidates(List.of("Here is Basil with this potion.", "Thanks, Basil!"), "en", EN);
        assertThat(names).containsExactly("Basil");
    }

    @Test
    void emphasisSentenceStartsAllCapsAndUnknownWordsAreNotChapterTerms() {
        // "Potion" capitalised for emphasis is also an ordinary word on the page.
        assertThat(ChapterTerms.candidates(List.of("Here is MY Potion!", "this potion"), "en", EN)).isEmpty();
        // Sentence starts carry no signal; all-caps lettering neither.
        assertThat(ChapterTerms.candidates(List.of("Basil wins. Mayor wins."), "en", EN)).isEmpty();
        assertThat(ChapterTerms.candidates(List.of("HERE IS BASIL WITH THIS POTION"), "en", EN)).isEmpty();
        // A name the dictionary does not know is already kept as written by the translation layer.
        assertThat(ChapterTerms.candidates(List.of("Here is Komona."), "en", EN)).isEmpty();
        // Scripts without capitals, and languages without a word list, have no such signal.
        assertThat(ChapterTerms.candidates(List.of("ここはバジルです"), "ja", EN)).isEmpty();
        assertThat(ChapterTerms.candidates(List.of("Here is Basil."), "en", Lexicon.NONE)).isEmpty();
    }

    @Test
    void decidedTermsAreFoundAsWholeWordsInTheirCaseOrInCapitals() {
        var found = ChapterTerms.occurrences("Basil! BASIL? basil, Basils", Map.of("Basil", "Manjericão"));
        assertThat(found).containsExactly(new ChapterTerms.Occurrence(0, 5, "Manjericão"),
            new ChapterTerms.Occurrence(7, 12, "MANJERICÃO"));
    }
}
