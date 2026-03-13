package com.mangareader.infrastructure.persistence.postgres.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.entity.StoreTitle;
import com.mangareader.domain.store.valueobject.StoreAvailability;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(StoreRepositoryAdapter.class)
@DisplayName("StoreRepositoryAdapter — Integração JPA")
class StoreRepositoryAdapterTest {

    @Autowired
    private StoreRepositoryPort storeRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Store storeA;
    private Store storeB;

    @BeforeEach
    void setUp() {
        storeA = entityManager.persistAndFlush(
                Store.builder()
                        .name("Amazon Manga")
                        .website("https://amazon.com")
                        .availability(StoreAvailability.IN_STOCK)
                        .rating(4.5)
                        .build()
        );

        storeB = entityManager.persistAndFlush(
                Store.builder()
                        .name("Manga Store JP")
                        .website("https://mangastore.jp")
                        .availability(StoreAvailability.PRE_ORDER)
                        .build()
        );

        // Adicionar StoreTitle para testar findByTitleId
        var storeTitle = StoreTitle.builder()
                .store(storeA)
                .titleId("title-mongo-123")
                .url("https://amazon.com/one-piece")
                .build();
        storeA.getTitles().add(storeTitle);
        entityManager.persistAndFlush(storeA);
    }

    @Nested
    @DisplayName("findAll")
    class FindAll {

        @Test
        @DisplayName("Deve retornar todas as lojas")
        void deveRetornarTodasAsLojas() {
            var stores = storeRepository.findAll();

            assertThat(stores).hasSize(2);
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar loja pelo ID")
        void deveRetornarLojaPeloId() {
            var result = storeRepository.findById(storeA.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Amazon Manga");
            assertThat(result.get().getAvailability()).isEqualTo(StoreAvailability.IN_STOCK);
        }

        @Test
        @DisplayName("Deve retornar empty para ID inexistente")
        void deveRetornarEmptyParaIdInexistente() {
            assertThat(storeRepository.findById(UUID.randomUUID())).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByTitleId")
    class FindByTitleId {

        @Test
        @DisplayName("Deve retornar lojas que possuem o título")
        void deveRetornarLojasComTitulo() {
            var result = storeRepository.findByTitleId("title-mongo-123");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Amazon Manga");
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando nenhuma loja possui o título")
        void deveRetornarVazioQuandoTituloInexistente() {
            var result = storeRepository.findByTitleId("titulo-inexistente");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findAll paginado")
    class FindAllPaginated {

        @Test
        @DisplayName("Deve retornar página com tamanho correto")
        void deveRetornarPaginaCorreta() {
            var page = storeRepository.findAll(PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(page.getTotalPages()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir nova loja e gerar UUID")
        void devePersistirNovaLoja() {
            var newStore = Store.builder()
                    .name("Bookwalker")
                    .website("https://bookwalker.jp")
                    .availability(StoreAvailability.IN_STOCK)
                    .build();

            var persisted = storeRepository.save(newStore);

            assertThat(persisted.getId()).isNotNull();
            assertThat(persisted.getName()).isEqualTo("Bookwalker");
        }

        @Test
        @DisplayName("Deve atualizar loja existente")
        void deveAtualizarLoja() {
            storeB.setName("Manga Store Japan");
            var updated = storeRepository.save(storeB);
            entityManager.flush();

            assertThat(updated.getName()).isEqualTo("Manga Store Japan");
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover loja pelo ID")
        void deveRemoverLoja() {
            storeRepository.deleteById(storeB.getId());
            entityManager.flush();

            assertThat(storeRepository.findById(storeB.getId())).isEmpty();
        }
    }
}
