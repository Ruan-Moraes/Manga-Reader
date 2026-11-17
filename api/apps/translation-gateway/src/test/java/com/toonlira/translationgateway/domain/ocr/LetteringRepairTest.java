package com.toonlira.translationgateway.domain.ocr;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class LetteringRepairTest {
    // Stand-in for lexicon/en-clause-openers.txt and en-alternatives.txt: the rule reads its word classes from them.
    private static final Lexicon EN = new Lexicon(java.util.Set.of(), java.util.Map.of(
        Lexicon.CLAUSE_OPENERS, java.util.Set.of("then", "so", "and"), Lexicon.ALTERNATIVES, java.util.Set.of("and", "or", "not")));

    private static String repair(String text) { return LetteringRepair.repairText(text, LetteringRepair.clausePattern(EN)); }
    private static final List<OcrManifest.Vertex> BOX = List.of(new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.2, .1),
        new OcrManifest.Vertex(.2, .2), new OcrManifest.Vertex(.1, .2));

    @Test
    void withoutTheLanguageListsOnlyAMarkOpeningASentenceIsRepaired() {
        assertThat(LetteringRepair.repairText("/ AGREE!", LetteringRepair.clausePattern(Lexicon.NONE))).isEqualTo("I AGREE!");
        assertThat(LetteringRepair.repairText("THEN / THINK", LetteringRepair.clausePattern(Lexicon.NONE))).isEqualTo("THEN / THINK");
    }

    @Test
    void aLoneSlashOrBarOpeningASentenceIsTheLetteredI() {
        assertThat(repair("/ AGREE!\n")).isEqualTo("I AGREE!\n");
        assertThat(repair("/ THINK\nTHE\nPROBLEM")).isEqualTo("I THINK\nTHE\nPROBLEM");
        assertThat(repair("OK. | KNOW")).isEqualTo("OK. I KNOW");
        assertThat(repair("WAIT\n/ SEE")).isEqualTo("WAIT\nI SEE");
        assertThat(repair("..THEN / THINK YOU DOUBLE CLICK")).isEqualTo("..THEN I THINK YOU DOUBLE CLICK");
        assertThat(repair("SO | GUESS IT WORKS")).isEqualTo("SO I GUESS IT WORKS");
    }

    @Test
    void anUnderscoreBetweenCapitalsIsTheDashOfAnInterruptedSentence() {
        assertThat(LetteringRepair.dashes("SO SHE COMES! IT IS HER_I MUST NOT FAIL!")).isEqualTo("SO SHE COMES! IT IS HER—I MUST NOT FAIL!");
        assertThat(LetteringRepair.dashes("SUCH A MESS_I\nSUPPOSE")).isEqualTo("SUCH A MESS—I\nSUPPOSE");
        // Screens and file names keep theirs; so does an underscore not between capitals.
        assertThat(LetteringRepair.dashes("case_ubuntu_v2.pdf")).isEqualTo("case_ubuntu_v2.pdf");
        assertThat(LetteringRepair.dashes("FILE_42")).isEqualTo("FILE_42");
        assertThat(LetteringRepair.repair(List.of(new OcrManifest.Region(java.util.UUID.randomUUID(), 0, "¡NO_YA!", BOX)), "es")
            .getFirst().sourceText()).isEqualTo("¡NO—YA!");
    }

    @Test
    void angleQuotesReadAsDoubledSignsAgainstAWordAreQuotes() {
        assertThat(LetteringRepair.quotes("¡Estudia tus\n<<Hechizos de\nfuego»>!")).isEqualTo("¡Estudia tus\n«Hechizos de\nfuego»!");
        assertThat(LetteringRepair.quotes("dijo <<no>>.")).isEqualTo("dijo «no».");
        // Comparisons, shifts and arrows are not against a word.
        assertThat(LetteringRepair.quotes("a << 2 >> 1, x -> y")).isEqualTo("a << 2 >> 1, x -> y");
    }

    @Test
    void slashesAndBarsInsideTextStay() {
        assertThat(repair("CLI / GUI")).isEqualTo("CLI / GUI");
        assertThat(repair("PICK ONE: AND / OR")).isEqualTo("PICK ONE: AND / OR");
        assertThat(repair("YES / NO")).isEqualTo("YES / NO");
        assertThat(repair("THIS AND / OR THAT")).isEqualTo("THIS AND / OR THAT");
        assertThat(repair("[CompizConfi...|| [Examples-...||")).isEqualTo("[CompizConfi...|| [Examples-...||");
        assertThat(repair("/usr/local/bin")).isEqualTo("/usr/local/bin");
        assertThat(repair("/ 2")).isEqualTo("/ 2");
    }

    @Test
    void onlyEnglishIsRepaired() {
        var region = new OcrManifest.Region(UUID.randomUUID(), 0, "/ AGREE!", List.of());
        assertThat(LetteringRepair.repair(List.of(region), "en", EN).getFirst().sourceText()).isEqualTo("I AGREE!");
        assertThat(LetteringRepair.repair(List.of(region), "fr", EN).getFirst()).isSameAs(region);
    }
}
