package com.mangareader.domain.manga.valueobject;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("PublicationStatus")
class PublicationStatusTest {

    @Test
    @DisplayName("Contém exatamente os status canônicos de título")
    void valoresCanonicos() {
        assertThat(PublicationStatus.values())
                .extracting(Enum::name)
                .containsExactly("ONGOING", "COMPLETED", "HIATUS", "CANCELLED");
    }

    @Test
    @DisplayName("valueOf resolve código canônico")
    void valueOf() {
        assertThat(PublicationStatus.valueOf("HIATUS"))
                .isEqualTo(PublicationStatus.HIATUS);
    }
}
