package com.toonlira.translationgateway.domain.ocr;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class GluedWordsTest {
    private static final Lexicon SPANISH = new Lexicon(Set.of("te", "dejo", "a", "y", "los", "demás", "unirte",
        "nosotros", "quieres", "dejar", "proteger", "e", "la", "tina", "con", "el", "otros"));

    private static OcrManifest.Region region(int order, String text) {
        var box = List.of(new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.2, .1), new OcrManifest.Vertex(.2, .2),
            new OcrManifest.Vertex(.1, .2));
        return new OcrManifest.Region(new UUID(0, order + 1), order, text, box);
    }

    private static List<String> split(String... texts) {
        var regions = new java.util.ArrayList<OcrManifest.Region>();
        for (int i = 0; i < texts.length; i++) regions.add(region(i, texts[i]));
        return GluedWords.split(regions, SPANISH).stream().map(OcrManifest.Region::sourceText).toList();
    }

    @Test
    void aRunStartingWithANameSeenAloneOnThePageIsCutIntoWords() {
        assertThat(split("Para proteger a Marta y los otros.", "Te dejo a Martayalos demás."))
            .containsExactly("Para proteger a Marta y los otros.", "Te dejo a Marta y a los demás.");
        assertThat(split("¿Quieres dejar Ravena?", "¿Quieres dejar Ravenayunirte a nosotros?"))
            .containsExactly("¿Quieres dejar Ravena?", "¿Quieres dejar Ravena y unirte a nosotros?");
        // Upper-case lettering keeps its case: only spaces are inserted.
        assertThat(split("MARTA!", "TE DEJO A MARTAYALOS DEMÁS")).containsExactly("MARTA!", "TE DEJO A MARTA Y A LOS DEMÁS");
    }

    @Test
    void aNameIsNeverCutWithoutThePageShowingItsBeginningAlone() {
        // "Gabriela" = "Gabri" + "e" + "la" in the dictionary, but "Gabri" never stands alone: the name stays whole.
        assertThat(split("Te dejo a Gabriela.", "Gabriela y los otros.")).containsExactly("Te dejo a Gabriela.", "Gabriela y los otros.");
        // A known word is never cut, nor a run whose rest is not dictionary words.
        assertThat(split("Marta.", "Martinez con el otros.", "Martaxyz.")).containsExactly("Marta.", "Martinez con el otros.", "Martaxyz.");
        // Without a dictionary nothing changes.
        var regions = List.of(region(0, "Marta."), region(1, "Martayalos."));
        assertThat(GluedWords.split(regions, Lexicon.NONE)).isSameAs(regions);
    }
}
