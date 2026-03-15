package com.mangareader.domain.store.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("StoreTitle")
class StoreTitleTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            UUID id = UUID.randomUUID();
            Store store = Store.builder().name("Amazon").build();

            StoreTitle storeTitle = StoreTitle.builder()
                    .id(id)
                    .store(store)
                    .titleId("mongo-title-123")
                    .url("https://amazon.com/manga/one-piece")
                    .build();

            assertEquals(id, storeTitle.getId());
            assertEquals(store, storeTitle.getStore());
            assertEquals("mongo-title-123", storeTitle.getTitleId());
            assertEquals("https://amazon.com/manga/one-piece", storeTitle.getUrl());
        }

        @Test
        @DisplayName("Deve permitir url null")
        void shouldAllowNullUrl() {
            StoreTitle storeTitle = StoreTitle.builder()
                    .titleId("mongo-456")
                    .build();

            assertNull(storeTitle.getUrl());
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            StoreTitle storeTitle = new StoreTitle();

            assertNull(storeTitle.getId());
            assertNull(storeTitle.getStore());
            assertNull(storeTitle.getTitleId());
            assertNull(storeTitle.getUrl());
        }
    }
}
