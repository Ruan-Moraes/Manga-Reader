package com.mangareader.domain.user.valueobject;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("VisibilitySetting")
class VisibilitySettingTest {

    @Test
    @DisplayName("Deve conter exatamente 3 valores: PUBLIC, PRIVATE, DO_NOT_TRACK")
    void deveConterTresValores() {
        VisibilitySetting[] values = VisibilitySetting.values();
        assertEquals(3, values.length);
    }

    @Test
    @DisplayName("Deve resolver PUBLIC via valueOf")
    void deveResolverPublic() {
        assertEquals(VisibilitySetting.PUBLIC, VisibilitySetting.valueOf("PUBLIC"));
    }

    @Test
    @DisplayName("Deve resolver PRIVATE via valueOf")
    void deveResolverPrivate() {
        assertEquals(VisibilitySetting.PRIVATE, VisibilitySetting.valueOf("PRIVATE"));
    }

    @Test
    @DisplayName("Deve resolver DO_NOT_TRACK via valueOf")
    void deveResolverDoNotTrack() {
        assertEquals(VisibilitySetting.DO_NOT_TRACK, VisibilitySetting.valueOf("DO_NOT_TRACK"));
    }

    @Test
    @DisplayName("Deve lançar IllegalArgumentException para valor inválido")
    void deveLancarExcecaoParaValorInvalido() {
        assertThrows(IllegalArgumentException.class, () -> VisibilitySetting.valueOf("INVALID"));
    }

    @Test
    @DisplayName("Deve manter ordinal correto")
    void deveManterOrdinalCorreto() {
        assertEquals(0, VisibilitySetting.PUBLIC.ordinal());
        assertEquals(1, VisibilitySetting.PRIVATE.ordinal());
        assertEquals(2, VisibilitySetting.DO_NOT_TRACK.ordinal());
    }
}
