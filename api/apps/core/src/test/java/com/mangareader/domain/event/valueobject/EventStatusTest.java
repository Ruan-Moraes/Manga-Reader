package com.mangareader.domain.event.valueobject;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("EventStatus.fromValue")
class EventStatusTest {

    @Test
    @DisplayName("Resolve pelo value do frontend (case-insensitive)")
    void resolvePeloValue() {
        assertThat(EventStatus.fromValue("happening_now")).isEqualTo(EventStatus.HAPPENING_NOW);
        assertThat(EventStatus.fromValue("ENDED")).isEqualTo(EventStatus.ENDED);
    }

    @Test
    @DisplayName("Resolve pelo nome do enum")
    void resolvePeloNome() {
        assertThat(EventStatus.fromValue("registrations_open")).isEqualTo(EventStatus.REGISTRATIONS_OPEN);
        assertThat(EventStatus.fromValue("Coming_Soon")).isEqualTo(EventStatus.COMING_SOON);
    }

    @Test
    @DisplayName("Lança IllegalArgumentException para valor inválido")
    void lancaParaInvalido() {
        assertThatThrownBy(() -> EventStatus.fromValue("nope")).isInstanceOf(IllegalArgumentException.class);
    }
}
