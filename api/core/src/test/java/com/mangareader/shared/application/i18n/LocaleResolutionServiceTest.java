package com.mangareader.shared.application.i18n;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

import static org.mockito.Mockito.mock;

@DisplayName("LocaleResolutionService")
class LocaleResolutionServiceTest {
    private final UserRepositoryPort userRepository = mock(UserRepositoryPort.class);
    private final LocaleResolutionService service = new LocaleResolutionService(userRepository);

    @AfterEach
    void resetLocale() {
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    @DisplayName("Deve resolver LocalizedString usando locale do contexto")
    void resolveStringComLocaleAtivo() {
        LocaleContextHolder.setLocale(Locale.forLanguageTag("en-US"));

        var ls = LocalizedString.of(Map.of("pt-BR", "Olá", "en-US", "Hello"));

        assertThat(service.resolve(ls)).isEqualTo("Hello");
    }

    @Test
    @DisplayName("Deve cair para pt-BR quando locale ativo não existe na tradução")
    void fallbackPtBr() {
        LocaleContextHolder.setLocale(Locale.forLanguageTag("ja-JP"));

        var ls = LocalizedString.of(Map.of("pt-BR", "Olá"));

        assertThat(service.resolve(ls)).isEqualTo("Olá");
    }

    @Test
    @DisplayName("Deve resolver LocalizedStringList usando locale do contexto")
    void resolveLista() {
        LocaleContextHolder.setLocale(Locale.forLanguageTag("es-ES"));

        var lsl = LocalizedStringList.of(Map.of(
                "pt-BR", List.of("a", "b"),
                "es-ES", List.of("x", "y")));

        assertThat(service.resolve(lsl)).containsExactly("x", "y");
    }

    @Test
    @DisplayName("currentLanguageTag deve refletir locale do contexto")
    void currentLanguageTag() {
        LocaleContextHolder.setLocale(Locale.forLanguageTag("en-US"));
        assertThat(service.currentLanguageTag()).isEqualTo("en-US");
    }

    @Test
    @DisplayName("Deve aceitar argumento null retornando string/lista vazia")
    void argumentoNull() {
        assertThat(service.resolve((LocalizedString) null)).isEmpty();
        assertThat(service.resolve((LocalizedStringList) null)).isEmpty();
    }
}
