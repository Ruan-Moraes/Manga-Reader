package com.mangareader.domain.store.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.store.valueobject.StoreAvailability;

class StoreTest {

    @Nested
    @DisplayName("Builder — valores default")
    class BuilderDefaultTests {

        @Test
        @DisplayName("Deve iniciar com listas vazias no builder padrão")
        void shouldInitializeDefaults() {
            Store store = Store.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Amazon"))
                    .website("https://amazon.com.br")
                    .build();

            assertThat(store.getFeatures()).isNotNull();
            assertThat(store.getFeatures().isEmpty()).isTrue();
            assertThat(store.getTitles()).isNotNull();
            assertThat(store.getTitles().isEmpty()).isTrue();
        }
    }

    @Nested
    @DisplayName("Builder — todos os campos")
    class BuilderAllFieldsTests {

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            Store store = Store.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Amazon Brasil"))
                    .logo("https://example.com/amazon-logo.png")
                    .icon("https://example.com/amazon-icon.png")
                    .description(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Maior loja online do Brasil"))
                    .website("https://amazon.com.br")
                    .availability(StoreAvailability.IN_STOCK)
                    .rating(4.5)
                    .features(List.of("Frete grátis", "Prime", "Kindle"))
                    .build();

            assertThat(store.getName().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Amazon Brasil");
            assertThat(store.getLogo()).isEqualTo("https://example.com/amazon-logo.png");
            assertThat(store.getIcon()).isEqualTo("https://example.com/amazon-icon.png");
            assertThat(store.getDescription().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Maior loja online do Brasil");
            assertThat(store.getWebsite()).isEqualTo("https://amazon.com.br");
            assertThat(store.getAvailability()).isEqualTo(StoreAvailability.IN_STOCK);
            assertThat(store.getRating()).isEqualTo(4.5);
            assertThat(store.getFeatures().size()).isEqualTo(3);
            assertThat(store.getFeatures().contains("Prime")).isTrue();
        }
    }

    @Nested
    @DisplayName("Store com títulos (cross-DB)")
    class StoreTitleTests {

        @Test
        @DisplayName("Deve permitir associar títulos à loja")
        void shouldAssociateTitlesToStore() {
            Store store = Store.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Amazon"))
                    .website("https://amazon.com.br")
                    .build();

            StoreTitle st1 = StoreTitle.builder()
                    .store(store)
                    .titleId("mongo-title-id-1")
                    .url("https://amazon.com.br/one-piece-vol-1")
                    .build();

            StoreTitle st2 = StoreTitle.builder()
                    .store(store)
                    .titleId("mongo-title-id-2")
                    .url("https://amazon.com.br/naruto-vol-1")
                    .build();

            store.getTitles().addAll(List.of(st1, st2));

            assertThat(store.getTitles().size()).isEqualTo(2);
            assertThat(store.getTitles().get(0).getTitleId()).isEqualTo("mongo-title-id-1");
            assertThat(store.getTitles().get(0).getStore()).isEqualTo(store);
        }

        @Test
        @DisplayName("StoreTitle deve suportar URL opcional")
        void storeTitleShouldSupportOptionalUrl() {
            StoreTitle st = StoreTitle.builder()
                    .titleId("title-1")
                    .build();

            assertThat(st.getTitleId()).isNotNull();
            assertThat(st.getUrl()).isNull();
        }
    }

    @Nested
    @DisplayName("StoreAvailability enum")
    class AvailabilityTests {

        @Test
        @DisplayName("Deve ter 3 tipos de disponibilidade")
        void shouldHaveThreeAvailabilityTypes() {
            assertThat(StoreAvailability.values().length).isEqualTo(3);
        }

        @Test
        @DisplayName("Deve suportar mudança de disponibilidade via setter")
        void shouldSupportAvailabilityChange() {
            Store store = Store.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Loja"))
                    .website("https://loja.com")
                    .availability(StoreAvailability.IN_STOCK)
                    .build();

            assertThat(store.getAvailability()).isEqualTo(StoreAvailability.IN_STOCK);

            store.setAvailability(StoreAvailability.OUT_OF_STOCK);
            assertThat(store.getAvailability()).isEqualTo(StoreAvailability.OUT_OF_STOCK);

            store.setAvailability(StoreAvailability.PRE_ORDER);
            assertThat(store.getAvailability()).isEqualTo(StoreAvailability.PRE_ORDER);
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            Store store = new Store();

            assertThat(store.getId()).isNull();
            assertThat(store.getName().isEmpty()).isTrue();
            assertThat(store.getLogo()).isNull();
            assertThat(store.getDescription().isEmpty()).isTrue();
            assertThat(store.getWebsite()).isNull();
            assertThat(store.getAvailability()).isNull();
            assertThat(store.getRating()).isNull();
        }
    }
}
