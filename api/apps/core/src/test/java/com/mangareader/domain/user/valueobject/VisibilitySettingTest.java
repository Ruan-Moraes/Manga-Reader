package com.mangareader.domain.user.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("VisibilitySetting")
class VisibilitySettingTest {

    @Test
    @DisplayName("Deve conter exatamente 3 valores: PUBLIC, PRIVATE, DO_NOT_TRACK")
    void deveConterTresValores() {
        VisibilitySetting[] values = VisibilitySetting.values();
        assertThat(values.length).isEqualTo(3);
    }

    @Test
    @DisplayName("Deve resolver PUBLIC via valueOf")
    void deveResolverPublic() {
        assertThat(VisibilitySetting.valueOf("PUBLIC")).isEqualTo(VisibilitySetting.PUBLIC);
    }

    @Test
    @DisplayName("Deve resolver PRIVATE via valueOf")
    void deveResolverPrivate() {
        assertThat(VisibilitySetting.valueOf("PRIVATE")).isEqualTo(VisibilitySetting.PRIVATE);
    }

    @Test
    @DisplayName("Deve resolver DO_NOT_TRACK via valueOf")
    void deveResolverDoNotTrack() {
        assertThat(VisibilitySetting.valueOf("DO_NOT_TRACK")).isEqualTo(VisibilitySetting.DO_NOT_TRACK);
    }

    @Test
    @DisplayName("Deve lançar IllegalArgumentException para valor inválido")
    void deveLancarExcecaoParaValorInvalido() {
        assertThatExceptionOfType(IllegalArgumentException.class).isThrownBy(() -> VisibilitySetting.valueOf("INVALID"));
    }

    @Test
    @DisplayName("Deve manter ordinal correto")
    void deveManterOrdinalCorreto() {
        assertThat(VisibilitySetting.PUBLIC.ordinal()).isEqualTo(0);
        assertThat(VisibilitySetting.PRIVATE.ordinal()).isEqualTo(1);
        assertThat(VisibilitySetting.DO_NOT_TRACK.ordinal()).isEqualTo(2);
    }
}
