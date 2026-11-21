package com.toonlira.translationgateway.infrastructure.translation;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.domain.ocr.Lexicon;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** Names come from the text and the language's dictionary, never from a list of the work's words. */
class ProtectedTermsTest {
    // A tiny stand-in dictionary: the rule must work with any language's word list.
    private static final Lexicon EN = new Lexicon(Set.of("i", "the", "is", "on", "my", "and", "use", "with", "ok",
        "talk", "to", "windows", "rocks", "open", "door", "she", "says"));
    private final ProtectedTerms terms = new ProtectedTerms(language -> "en".equals(language) ? EN : Lexicon.NONE);

    @Test
    void namesAreRecognisedFromTheirShape() {
        // camelCase anywhere; acronyms and capitalised unknown words mid-sentence.
        assertThat(terms.find("I talk to Mirella on Kanbaru with my DSLR and YouTube", "en"))
            .containsExactly("Mirella", "Kanbaru", "DSLR", "YouTube");
        assertThat(terms.find("Open the door, Zorvak!", "en")).containsExactly("Zorvak");
    }

    @Test
    void ordinaryWordsSentenceStartsAndAllCapsLetteringAreNotNames() {
        assertThat(terms.find("Windows is open. Zorvak says ok", "en")).isEmpty(); // known word, sentence start
        assertThat(terms.find("I use OK and the Door", "en")).isEmpty();           // known in any case
        assertThat(terms.find("THE ZORVAK ROCKS ON MY DSLR!", "en")).isEmpty();   // all caps: no signal
        assertThat(terms.find("THE ZORVAK USES YouTube", "en")).containsExactly("YouTube"); // camelCase still is
        assertThat(terms.find("see the iPhone and OpenOffice, not my examples-L", "en")).containsExactly("iPhone", "OpenOffice");
    }

    @Test
    void latinWordsInsideJapaneseTextAreTerms() {
        assertThat(terms.find("Ubuntu を入れてみる", "ja")).containsExactly("Ubuntu");
        assertThat(terms.find("ターミナルがあれば", "ja")).isEmpty();
    }

    @Test
    void formatsAreStillProtectedAndLiteralOnlyTextSkipsTheTranslator() {
        assertThat(terms.find("Run $wget on https://example.com/a and save case_v2.pdf", "en"))
            .containsExactly("$wget", "https://example.com/a", "case_v2.pdf");
        assertThat(terms.isLiteralOnly("YouTube", "en")).isTrue();
        assertThat(terms.isLiteralOnly("Zorvak", "en")).isFalse(); // sentence start: may be a word to translate
        assertThat(terms.isLiteralOnly("Open YouTube", "en")).isFalse();
    }
}
