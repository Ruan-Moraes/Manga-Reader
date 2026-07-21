package com.mangareader.domain.store.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import jakarta.persistence.Column;

@DisplayName("StoreTitle")
class StoreTitleTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            UUID id = UUID.randomUUID();
            Store store = Store.builder().name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Amazon")).build();

            StoreTitle storeTitle = StoreTitle.builder()
                    .id(id)
                    .store(store)
                    .titleId("mongo-title-123")
                    .url("https://amazon.com/manga/one-piece")
                    .build();

            assertThat(storeTitle.getId()).isEqualTo(id);
            assertThat(storeTitle.getStore()).isEqualTo(store);
            assertThat(storeTitle.getTitleId()).isEqualTo("mongo-title-123");
            assertThat(storeTitle.getUrl()).isEqualTo("https://amazon.com/manga/one-piece");
        }

        @Test
        @DisplayName("Deve mapear URL como obrigatória e limitada a 500 caracteres")
        void shouldMapUrlAsRequired() throws NoSuchFieldException {
            Column mapping = StoreTitle.class.getDeclaredField("url").getAnnotation(Column.class);

            assertThat(mapping.nullable()).isFalse();
            assertThat(mapping.length()).isEqualTo(500);
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            StoreTitle storeTitle = new StoreTitle();

            assertThat(storeTitle.getId()).isNull();
            assertThat(storeTitle.getStore()).isNull();
            assertThat(storeTitle.getTitleId()).isNull();
            assertThat(storeTitle.getUrl()).isNull();
        }
    }
}
