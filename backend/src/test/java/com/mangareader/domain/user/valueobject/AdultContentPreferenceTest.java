package com.mangareader.domain.user.valueobject;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("AdultContentPreference")
class AdultContentPreferenceTest {

    @Test
    @DisplayName("Deve conter exatamente 3 valores: BLUR, SHOW, HIDE")
    void deveConterTresValores() {
        AdultContentPreference[] values = AdultContentPreference.values();
        assertEquals(3, values.length);
    }

    @Test
    @DisplayName("Deve resolver BLUR via valueOf")
    void deveResolverBlur() {
        assertEquals(AdultContentPreference.BLUR, AdultContentPreference.valueOf("BLUR"));
    }

    @Test
    @DisplayName("Deve resolver SHOW via valueOf")
    void deveResolverShow() {
        assertEquals(AdultContentPreference.SHOW, AdultContentPreference.valueOf("SHOW"));
    }

    @Test
    @DisplayName("Deve resolver HIDE via valueOf")
    void deveResolverHide() {
        assertEquals(AdultContentPreference.HIDE, AdultContentPreference.valueOf("HIDE"));
    }

    @Test
    @DisplayName("Deve lançar IllegalArgumentException para valor inválido")
    void deveLancarExcecaoParaValorInvalido() {
        assertThrows(IllegalArgumentException.class, () -> AdultContentPreference.valueOf("INVALID"));
    }

    @Test
    @DisplayName("Deve manter ordinal correto")
    void deveManterOrdinalCorreto() {
        assertEquals(0, AdultContentPreference.BLUR.ordinal());
        assertEquals(1, AdultContentPreference.SHOW.ordinal());
        assertEquals(2, AdultContentPreference.HIDE.ordinal());
    }
}
