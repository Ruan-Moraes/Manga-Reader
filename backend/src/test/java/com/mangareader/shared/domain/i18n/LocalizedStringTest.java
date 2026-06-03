package com.mangareader.shared.domain.i18n;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mangareader.domain.manga.entity.Title;

@DisplayName("LocalizedString")
class LocalizedStringTest {
    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final Locale EN_US = Locale.forLanguageTag("en-US");
    private static final Locale ES_ES = Locale.forLanguageTag("es-ES");
    private static final Locale JA_JP = Locale.forLanguageTag("ja-JP");

    @Nested
    @DisplayName("resolve()")
    class Resolve {
        @Test
        @DisplayName("Deve retornar tradução exata quando locale existe")
        void deveRetornarTraducaoExata() {
            var ls = LocalizedString.of(Map.of(
                    "pt-BR", "Olá",
                    "en-US", "Hello",
                    "es-ES", "Hola"));

            assertThat(ls.resolve(EN_US)).isEqualTo("Hello");
            assertThat(ls.resolve(ES_ES)).isEqualTo("Hola");
            assertThat(ls.resolve(PT_BR)).isEqualTo("Olá");
        }

        @Test
        @DisplayName("Deve cair para pt-BR quando locale solicitado não existe")
        void deveCairParaPtBrQuandoAusente() {
            var ls = LocalizedString.of(Map.of(
                    "pt-BR", "Olá",
                    "en-US", "Hello"));

            assertThat(ls.resolve(JA_JP)).isEqualTo("Olá");
        }

        @Test
        @DisplayName("Deve cair para primeira tradução quando pt-BR ausente")
        void deveCairParaPrimeiraQuandoPtBrAusente() {
            var ls = LocalizedString.of(Map.of(
                    "en-US", "Hello",
                    "es-ES", "Hola"));

            assertThat(ls.resolve(JA_JP)).isIn("Hello", "Hola");
        }

        @Test
        @DisplayName("Deve retornar string vazia quando não há nenhuma tradução")
        void deveRetornarStringVaziaQuandoTudoAusente() {
            assertThat(LocalizedString.empty().resolve(EN_US)).isEmpty();
        }

        @Test
        @DisplayName("Deve cair para pt-BR quando locale é null")
        void deveCairParaPtBrQuandoLocaleNull() {
            var ls = LocalizedString.of(Map.of("pt-BR", "Olá", "en-US", "Hello"));

            assertThat(ls.resolve(null)).isEqualTo("Olá");
        }

        @Test
        @DisplayName("Deve ignorar tradução em branco e cair para fallback")
        void deveIgnorarTraducaoEmBranco() {
            var ls = LocalizedString.of(Map.of(
                    "pt-BR", "Olá",
                    "en-US", "   "));

            assertThat(ls.resolve(EN_US)).isEqualTo("Olá");
        }
    }

    @Nested
    @DisplayName("resolveOrNull()")
    class ResolveOrNull {
        @Test
        @DisplayName("Deve retornar null quando tradução exata não existe")
        void deveRetornarNullQuandoAusente() {
            var ls = LocalizedString.of(Map.of("pt-BR", "Olá"));

            assertThat(ls.resolveOrNull(EN_US)).isNull();
        }

        @Test
        @DisplayName("Deve retornar tradução exata sem aplicar fallback")
        void deveRetornarExataSemFallback() {
            var ls = LocalizedString.of(Map.of("pt-BR", "Olá", "en-US", "Hello"));

            assertThat(ls.resolveOrNull(EN_US)).isEqualTo("Hello");
        }
    }

    @Nested
    @DisplayName("Imutabilidade e helpers")
    class Imutabilidade {
        @Test
        @DisplayName("with() deve retornar nova instância sem alterar a original")
        void withDeveSerImutavel() {
            var original = LocalizedString.ofDefault("Olá");
            var modified = original.with("en-US", "Hello");

            assertThat(original.values()).hasSize(1);
            assertThat(modified.values()).hasSize(2);
            assertThat(modified).isNotSameAs(original);
        }

        @Test
        @DisplayName("values() deve retornar mapa não modificável")
        void valuesNaoModificavel() {
            var ls = LocalizedString.ofDefault("Olá");

            assertThatThrownBy(() -> ls.values().put("en-US", "Hello"))
                    .isInstanceOf(UnsupportedOperationException.class);
        }

        @Test
        @DisplayName("ofDefault() deve criar instância apenas com pt-BR")
        void ofDefaultApenasPtBr() {
            var ls = LocalizedString.ofDefault("Olá");

            assertThat(ls.values()).containsExactly(Map.entry("pt-BR", "Olá"));
        }

        @Test
        @DisplayName("equals/hashCode baseados no mapa")
        void equalsHashCode() {
            var a = LocalizedString.of(Map.of("pt-BR", "Olá"));

            var b = LocalizedString.ofDefault("Olá");

            assertThat(a).isEqualTo(b).hasSameHashCodeAs(b);
        }
    }

    @Nested
    @DisplayName("Serialização Jackson (cache Redis)")
    class Serializacao {
        @Test
        @DisplayName("Round-trip Jackson reconstrói via @JsonCreator (regressão cache)")
        void roundTripJackson() throws Exception {
            var mapper = new ObjectMapper();
            var ls = LocalizedString.of(Map.of("pt-BR", "Olá", "en-US", "Hello"));

            String json = mapper.writeValueAsString(ls);
            var back = mapper.readValue(json, LocalizedString.class);

            assertThat(back).isEqualTo(ls);
            assertThat(back.resolve(EN_US)).isEqualTo("Hello");
        }

        @Test
        @DisplayName("Title aninhado sobrevive ao GenericJackson2JsonRedisSerializer")
        void roundTripRedisSerializer() {
            var serializer = new GenericJackson2JsonRedisSerializer();
            var title = Title.builder()
                    .id("2")
                    .name(LocalizedString.of(Map.of("pt-BR", "Olá", "en-US", "Hello")))
                    .synopsis(LocalizedString.ofDefault("Sinopse"))
                    .build();

            byte[] bytes = serializer.serialize(title);
            var back = (Title) serializer.deserialize(bytes);

            assertThat(back.getName()).isEqualTo(title.getName());
            assertThat(back.getName().resolve(EN_US)).isEqualTo("Hello");
            assertThat(back.getSynopsis().resolve(PT_BR)).isEqualTo("Sinopse");
        }

        @Test
        @DisplayName("Entrada legada sem 'values' desserializa para vazio (sem NPE)")
        void roundTripLegacyShape() {
            var serializer = new GenericJackson2JsonRedisSerializer();

            String legacy = "{\"@class\":\"com.mangareader.shared.domain.i18n.LocalizedString\","
                    + "\"empty\":false}";

            var back = (LocalizedString) serializer.deserialize(legacy.getBytes());

            assertThat(back.isEmpty()).isTrue();
        }
    }
}
