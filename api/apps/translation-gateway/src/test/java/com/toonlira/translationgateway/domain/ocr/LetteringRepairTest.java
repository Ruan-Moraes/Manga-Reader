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
