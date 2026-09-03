package com.mangareader.infrastructure.persistence.postgres.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.entity.StoreTitle;
import com.mangareader.infrastructure.persistence.postgres.PostgresTestContainerConfig;
import com.mangareader.shared.domain.i18n.LocalizedString;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(PostgresTestContainerConfig.class)
@TestPropertySource(properties = {
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"
})
@DisplayName("StoreTitleJpaRepository")
@Tag("testcontainers")
class StoreTitleJpaRepositoryTest {

    private static final String TITLE_ID = "507f1f77bcf86cd799439011";

    @Autowired
    private StoreTitleJpaRepository repository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("Deve paginar vínculos carregando a store sem inicializar sua coleção de títulos")
    void devePaginarVinculosComStoreCarregada() {
        Store store = entityManager.persistAndFlush(Store.builder()
                .name(LocalizedString.ofDefault("Loja"))
                .website("https://store.example")
                .build());
        entityManager.persistAndFlush(StoreTitle.builder()
                .store(store)
                .titleId(TITLE_ID)
                .url("https://store.example/titulo")
                .build());
        entityManager.clear();

        var page = repository.findByTitleId(TITLE_ID, PageRequest.of(0, 20));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent()).singleElement().satisfies(link -> {
            assertThat(link.getUrl()).isEqualTo("https://store.example/titulo");
            assertThat(entityManager.getEntityManager().getEntityManagerFactory()
                    .getPersistenceUnitUtil().isLoaded(link.getStore())).isTrue();
        });
    }

    @Test
    @DisplayName("Busca vínculos de vários títulos em uma única consulta com stores carregadas")
    void findByTitleIdIn() {
        Store store = entityManager.persistAndFlush(Store.builder()
                .name(LocalizedString.ofDefault("Loja em lote"))
                .website("https://batch.example")
                .build());
        entityManager.persistAndFlush(StoreTitle.builder().store(store)
                .titleId(TITLE_ID).url("https://batch.example/one").build());
        entityManager.persistAndFlush(StoreTitle.builder().store(store)
                .titleId("507f1f77bcf86cd799439012").url("https://batch.example/two").build());
        entityManager.clear();

        var links = repository.findByTitleIdIn(List.of(
                TITLE_ID, "507f1f77bcf86cd799439012"));

        assertThat(links).hasSize(2).allSatisfy(link -> assertThat(
                entityManager.getEntityManager().getEntityManagerFactory()
                        .getPersistenceUnitUtil().isLoaded(link.getStore())).isTrue());
    }
}
