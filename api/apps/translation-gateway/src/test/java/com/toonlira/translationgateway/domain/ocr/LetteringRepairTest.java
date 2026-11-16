package com.toonlira.translationgateway.domain.ocr;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class LetteringRepairTest {
    @Test
    void aLoneSlashOrBarOpeningASentenceIsTheLetteredI() {
        assertThat(LetteringRepair.repairText("/ AGREE!\n")).isEqualTo("I AGREE!\n");
        assertThat(LetteringRepair.repairText("/ THINK\nTHE\nPROBLEM")).isEqualTo("I THINK\nTHE\nPROBLEM");
        assertThat(LetteringRepair.repairText("OK. | KNOW")).isEqualTo("OK. I KNOW");
        assertThat(LetteringRepair.repairText("WAIT\n/ SEE")).isEqualTo("WAIT\nI SEE");
    }

    @Test
    void slashesAndBarsInsideTextStay() {
        assertThat(LetteringRepair.repairText("CLI / GUI")).isEqualTo("CLI / GUI");
        assertThat(LetteringRepair.repairText("[CompizConfi...|| [Examples-...||")).isEqualTo("[CompizConfi...|| [Examples-...||");
        assertThat(LetteringRepair.repairText("/usr/local/bin")).isEqualTo("/usr/local/bin");
        assertThat(LetteringRepair.repairText("/ 2")).isEqualTo("/ 2");
    }

    @Test
    void onlyEnglishIsRepaired() {
        var region = new OcrManifest.Region(UUID.randomUUID(), 0, "/ AGREE!", List.of());
        assertThat(LetteringRepair.repair(List.of(region), "en").getFirst().sourceText()).isEqualTo("I AGREE!");
        assertThat(LetteringRepair.repair(List.of(region), "fr").getFirst()).isSameAs(region);
    }
}
