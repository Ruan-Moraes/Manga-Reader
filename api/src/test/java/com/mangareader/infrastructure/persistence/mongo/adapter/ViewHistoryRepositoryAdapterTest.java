package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.IndexResolver;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.domain.user.entity.ViewHistory;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import({ViewHistoryRepositoryAdapter.class, MongoTestContainerConfig.class})
@DisplayName("ViewHistoryRepositoryAdapter — Integração MongoDB")
@Tag("testcontainers")
class ViewHistoryRepositoryAdapterTest {

    @Autowired
    private ViewHistoryRepositoryPort viewHistoryRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private ViewHistory user1Title1;
    private ViewHistory user1Title2;
    private ViewHistory user2Title1;

    @BeforeEach
    void setUp() {
        mongoTemplate.dropCollection(ViewHistory.class);

        // Recriar indexes (inclui o CompoundIndex unique userId+titleId) após drop
        IndexOperations indexOps = mongoTemplate.indexOps(ViewHistory.class);
        IndexResolver resolver = new MongoPersistentEntityIndexResolver(
                mongoTemplate.getConverter().getMappingContext());
        resolver.resolveIndexFor(ViewHistory.class).forEach(indexOps::ensureIndex);

        user1Title1 = mongoTemplate.save(ViewHistory.builder()
                .userId("user-1")
                .titleId("title-1")
                .titleName("Reino de Aço")
                .titleCover("cover-1.jpg")
                .viewedAt(LocalDateTime.of(2024, 1, 1, 10, 0))
                .build());

        user1Title2 = mongoTemplate.save(ViewHistory.builder()
                .userId("user-1")
                .titleId("title-2")
                .titleName("Lâmina do Amanhã")
                .titleCover("cover-2.jpg")
                .viewedAt(LocalDateTime.of(2024, 1, 3, 10, 0))
                .build());

        user2Title1 = mongoTemplate.save(ViewHistory.builder()
                .userId("user-2")
                .titleId("title-1")
                .titleName("Reino de Aço")
                .titleCover("cover-1.jpg")
                .viewedAt(LocalDateTime.of(2024, 1, 2, 10, 0))
                .build());
    }

    @Nested
    @DisplayName("findByUserIdOrderByViewedAtDesc")
    class FindByUserIdOrderByViewedAtDesc {

        @Test
        @DisplayName("Deve retornar histórico do usuário ordenado por viewedAt desc")
        void deveRetornarHistoricoOrdenado() {
            var page = viewHistoryRepository.findByUserIdOrderByViewedAtDesc(
                    "user-1", PageRequest.of(0, 10));

            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(page.getContent())
                    .extracting(ViewHistory::getTitleId)
                    .containsExactly("title-2", "title-1");
        }

        @Test
        @DisplayName("Deve paginar o histórico do usuário")
        void devePaginarHistorico() {
            var page = viewHistoryRepository.findByUserIdOrderByViewedAtDesc(
                    "user-1", PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(page.getContent().get(0).getTitleId()).isEqualTo("title-2");
        }

        @Test
        @DisplayName("Deve retornar página vazia para usuário sem histórico")
        void deveRetornarVazioParaUsuarioSemHistorico() {
            var page = viewHistoryRepository.findByUserIdOrderByViewedAtDesc(
                    "user-inexistente", PageRequest.of(0, 10));

            assertThat(page.getContent()).isEmpty();
            assertThat(page.getTotalElements()).isZero();
        }
    }

    @Nested
    @DisplayName("findByUserIdAndTitleId")
    class FindByUserIdAndTitleId {

        @Test
        @DisplayName("Deve retornar entrada quando combinação existe")
        void deveRetornarEntradaQuandoExiste() {
            var result = viewHistoryRepository.findByUserIdAndTitleId("user-1", "title-1");

            assertThat(result).isPresent();
            assertThat(result.get().getTitleName()).isEqualTo("Reino de Aço");
        }

        @Test
        @DisplayName("Deve retornar empty para combinação inexistente")
        void deveRetornarEmptyParaCombinacaoInexistente() {
            var result = viewHistoryRepository.findByUserIdAndTitleId("user-2", "title-2");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir nova entrada e gerar ID")
        void devePersistirNovaEntrada() {
            var nova = ViewHistory.builder()
                    .userId("user-3")
                    .titleId("title-9")
                    .titleName("Flores de Neon")
                    .viewedAt(LocalDateTime.now())
                    .build();

            var saved = viewHistoryRepository.save(nova);

            assertThat(saved.getId()).isNotNull();
            assertThat(viewHistoryRepository.findByUserIdAndTitleId("user-3", "title-9"))
                    .isPresent();
        }

        @Test
        @DisplayName("Deve atualizar entrada existente sem violar índice único")
        void deveAtualizarEntradaExistente() {
            user1Title1.setTitleName("Reino de Aço (Atualizado)");

            viewHistoryRepository.save(user1Title1);

            var updated = viewHistoryRepository.findByUserIdAndTitleId("user-1", "title-1");
            assertThat(updated).isPresent();
            assertThat(updated.get().getTitleName()).isEqualTo("Reino de Aço (Atualizado)");
            assertThat(viewHistoryRepository.findByUserIdOrderByViewedAtDesc(
                    "user-1", PageRequest.of(0, 10)).getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve lançar exceção ao duplicar userId+titleId")
        void deveLancarExcecaoAoDuplicar() {
            var duplicate = ViewHistory.builder()
                    .userId("user-1")
                    .titleId("title-1")
                    .titleName("Duplicado")
                    .viewedAt(LocalDateTime.now())
                    .build();

            assertThatThrownBy(() -> viewHistoryRepository.save(duplicate))
                    .isInstanceOf(DuplicateKeyException.class);
        }
    }

    @Nested
    @DisplayName("deleteAllByUserId")
    class DeleteAllByUserId {

        @Test
        @DisplayName("Deve remover todo o histórico do usuário sem afetar outros")
        void deveRemoverHistoricoDoUsuario() {
            viewHistoryRepository.deleteAllByUserId("user-1");

            assertThat(viewHistoryRepository.findByUserIdOrderByViewedAtDesc(
                    "user-1", PageRequest.of(0, 10)).getTotalElements()).isZero();
            assertThat(viewHistoryRepository.findByUserIdAndTitleId("user-2", "title-1"))
                    .isPresent();
        }
    }
}
