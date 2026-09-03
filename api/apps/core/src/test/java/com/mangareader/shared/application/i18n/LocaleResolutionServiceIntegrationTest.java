package com.mangareader.shared.application.i18n;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.shared.domain.i18n.LocalizedString;

import java.util.Map;

/**
 * Integration test que valida a cadeia Accept-Language → LocaleResolver
 * → LocaleContextHolder → LocaleResolutionService end-to-end através de
 * um endpoint controlado.
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@org.springframework.context.annotation.Import(LocaleResolutionServiceIntegrationTest.LocaleProbeController.class)
@DisplayName("LocaleResolutionService — integration")
class LocaleResolutionServiceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @RestController
    @RequestMapping("/__test/locale")
    static class LocaleProbeController {

        private static final LocalizedString SAMPLE = LocalizedString.of(Map.of(
                "pt-BR", "Olá",
                "en-US", "Hello",
                "es-ES", "Hola"
        ));

        private final LocaleResolutionService resolver;

        LocaleProbeController(LocaleResolutionService resolver) {
            this.resolver = resolver;
        }

        @GetMapping
        public Map<String, String> probe() {
            return Map.of(
                    "tag", resolver.currentLanguageTag(),
                    "resolved", resolver.resolve(SAMPLE),
                    "holder", LocaleContextHolder.getLocale().toLanguageTag()
            );
        }
    }

    @Test
    @DisplayName("Accept-Language pt-BR resolve para Olá")
    void resolvePtBR() throws Exception {
        mockMvc.perform(get("/__test/locale").header("Accept-Language", "pt-BR"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.resolved").value("Olá"))
                .andExpect(header().exists("Vary"));
    }

    @Test
    @DisplayName("Accept-Language en-US resolve para Hello")
    void resolveEnUS() throws Exception {
        mockMvc.perform(get("/__test/locale").header("Accept-Language", "en-US"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.resolved").value("Hello"));
    }

    @Test
    @DisplayName("Accept-Language es-ES resolve para Hola")
    void resolveEsES() throws Exception {
        mockMvc.perform(get("/__test/locale").header("Accept-Language", "es-ES"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.resolved").value("Hola"));
    }

    @Test
    @DisplayName("Locale ausente faz fallback para pt-BR")
    void fallbackPtBR() throws Exception {
        mockMvc.perform(get("/__test/locale").header("Accept-Language", "ja-JP"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.resolved").value("Olá"));
    }
}
