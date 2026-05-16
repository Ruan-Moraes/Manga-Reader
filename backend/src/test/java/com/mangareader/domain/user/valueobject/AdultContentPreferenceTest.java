package com.mangareader.domain.user.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("AdultContentPreference")
class AdultContentPreferenceTest {

    @Test
    @DisplayName("Deve conter exatamente 3 valores: BLUR, SHOW, HIDE")
    void deveConterTresValores() {
        AdultContentPreference[] values = AdultContentPreference.values();
        assertThat(values.length).isEqualTo(3);
    }

    @Test
    @DisplayName("Deve resolver BLUR via valueOf")
    void deveResolverBlur() {
        assertThat(AdultContentPreference.valueOf("BLUR")).isEqualTo(AdultContentPreference.BLUR);
    }

    @Test
    @DisplayName("Deve resolver SHOW via valueOf")
    void deveResolverShow() {
        assertThat(AdultContentPreference.valueOf("SHOW")).isEqualTo(AdultContentPreference.SHOW);
    }

    @Test
    @DisplayName("Deve resolver HIDE via valueOf")
    void deveResolverHide() {
        assertThat(AdultContentPreference.valueOf("HIDE")).isEqualTo(AdultContentPreference.HIDE);
    }

    @Test
    @DisplayName("Deve lançar IllegalArgumentException para valor inválido")
    void deveLancarExcecaoParaValorInvalido() {
        assertThatExceptionOfType(IllegalArgumentException.class).isThrownBy(() -> AdultContentPreference.valueOf("INVALID"));
    }

    @Test
    @DisplayName("Deve manter ordinal correto")
    void deveManterOrdinalCorreto() {
        assertThat(AdultContentPreference.BLUR.ordinal()).isEqualTo(0);
        assertThat(AdultContentPreference.SHOW.ordinal()).isEqualTo(1);
        assertThat(AdultContentPreference.HIDE.ordinal()).isEqualTo(2);
    }
}
