package com.mangareader.domain.store.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
                    .name("Amazon")
                    .website("https://amazon.com.br")
                    .build();

            assertNotNull(store.getFeatures());
            assertTrue(store.getFeatures().isEmpty());
            assertNotNull(store.getTitles());
            assertTrue(store.getTitles().isEmpty());
        }
    }

    @Nested
    @DisplayName("Builder — todos os campos")
    class BuilderAllFieldsTests {

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            Store store = Store.builder()
                    .name("Amazon Brasil")
                    .logo("https://example.com/amazon-logo.png")
                    .icon("https://example.com/amazon-icon.png")
                    .description("Maior loja online do Brasil")
                    .website("https://amazon.com.br")
                    .availability(StoreAvailability.IN_STOCK)
                    .rating(4.5)
                    .features(List.of("Frete grátis", "Prime", "Kindle"))
                    .build();

            assertEquals("Amazon Brasil", store.getName());
            assertEquals("https://example.com/amazon-logo.png", store.getLogo());
            assertEquals("https://example.com/amazon-icon.png", store.getIcon());
            assertEquals("Maior loja online do Brasil", store.getDescription());
            assertEquals("https://amazon.com.br", store.getWebsite());
            assertEquals(StoreAvailability.IN_STOCK, store.getAvailability());
            assertEquals(4.5, store.getRating());
            assertEquals(3, store.getFeatures().size());
            assertTrue(store.getFeatures().contains("Prime"));
        }
    }

    @Nested
    @DisplayName("Store com títulos (cross-DB)")
    class StoreTitleTests {

        @Test
        @DisplayName("Deve permitir associar títulos à loja")
        void shouldAssociateTitlesToStore() {
            Store store = Store.builder()
                    .name("Amazon")
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

            assertEquals(2, store.getTitles().size());
            assertEquals("mongo-title-id-1", store.getTitles().get(0).getTitleId());
            assertEquals(store, store.getTitles().get(0).getStore());
        }

        @Test
        @DisplayName("StoreTitle deve suportar URL opcional")
        void storeTitleShouldSupportOptionalUrl() {
            StoreTitle st = StoreTitle.builder()
                    .titleId("title-1")
                    .build();

            assertNotNull(st.getTitleId());
            assertNull(st.getUrl());
        }
    }

    @Nested
    @DisplayName("StoreAvailability enum")
    class AvailabilityTests {

        @Test
        @DisplayName("Deve ter 3 tipos de disponibilidade")
        void shouldHaveThreeAvailabilityTypes() {
            assertEquals(3, StoreAvailability.values().length);
        }

        @Test
        @DisplayName("Deve suportar mudança de disponibilidade via setter")
        void shouldSupportAvailabilityChange() {
            Store store = Store.builder()
                    .name("Loja")
                    .website("https://loja.com")
                    .availability(StoreAvailability.IN_STOCK)
                    .build();

            assertEquals(StoreAvailability.IN_STOCK, store.getAvailability());

            store.setAvailability(StoreAvailability.OUT_OF_STOCK);
            assertEquals(StoreAvailability.OUT_OF_STOCK, store.getAvailability());

            store.setAvailability(StoreAvailability.PRE_ORDER);
            assertEquals(StoreAvailability.PRE_ORDER, store.getAvailability());
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            Store store = new Store();

            assertNull(store.getId());
            assertNull(store.getName());
            assertNull(store.getLogo());
            assertNull(store.getDescription());
            assertNull(store.getWebsite());
            assertNull(store.getAvailability());
            assertNull(store.getRating());
        }
    }
}
