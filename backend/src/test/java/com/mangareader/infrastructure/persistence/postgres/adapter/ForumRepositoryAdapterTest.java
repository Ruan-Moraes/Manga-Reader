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

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(ForumRepositoryAdapter.class)
@DisplayName("ForumRepositoryAdapter — Integração JPA")
class ForumRepositoryAdapterTest {

    @Autowired
    private ForumRepositoryPort forumRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User author;
    private ForumTopic topicGeral;
    private ForumTopic topicSpoilers;

    @BeforeEach
    void setUp() {
        author = entityManager.persistAndFlush(
                User.builder()
                        .name("Ruan")
                        .email("ruan@email.com")
                        .passwordHash("hash")
                        .build()
        );

        topicGeral = entityManager.persistAndFlush(
                ForumTopic.builder()
                        .author(author)
                        .title("Melhor manga de 2026?")
                        .content("Qual o melhor manga que vocês leram este ano?")
                        .category(ForumCategory.GERAL)
                        .build()
        );

        topicSpoilers = entityManager.persistAndFlush(
                ForumTopic.builder()
                        .author(author)
                        .title("One Piece 1200 discussion")
                        .content("Spoilers do capítulo mais recente.")
                        .category(ForumCategory.SPOILERS)
                        .build()
        );
    }

    @Nested
    @DisplayName("findAll")
    class FindAll {

        @Test
        @DisplayName("Deve retornar todos os tópicos paginados")
        void deveRetornarTodosOsTopicos() {
            var page = forumRepository.findAll(PageRequest.of(0, 10));

            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve respeitar tamanho da página")
        void deveRespeitarTamanhoDaPagina() {
            var page = forumRepository.findAll(PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalPages()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar tópico pelo ID")
        void deveRetornarTopicoPeloId() {
            var result = forumRepository.findById(topicGeral.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getTitle()).isEqualTo("Melhor manga de 2026?");
            assertThat(result.get().getCategory()).isEqualTo(ForumCategory.GERAL);
        }

        @Test
        @DisplayName("Deve retornar empty para ID inexistente")
        void deveRetornarEmptyParaIdInexistente() {
            assertThat(forumRepository.findById(UUID.randomUUID())).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByCategory")
    class FindByCategory {

        @Test
        @DisplayName("Deve filtrar tópicos por categoria")
        void deveFiltrarPorCategoria() {
            var page = forumRepository.findByCategory(ForumCategory.SPOILERS, PageRequest.of(0, 10));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getContent().get(0).getTitle()).isEqualTo("One Piece 1200 discussion");
        }

        @Test
        @DisplayName("Deve retornar página vazia para categoria sem tópicos")
        void deveRetornarVazioParaCategoriaSemTopicos() {
            var page = forumRepository.findByCategory(ForumCategory.FANART, PageRequest.of(0, 10));

            assertThat(page.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("searchByTitle")
    class SearchByTitle {

        @Test
        @DisplayName("Deve buscar tópicos por trecho do título (case insensitive)")
        void deveBuscarPorTrechoDoTitulo() {
            var page = forumRepository.searchByTitle("one piece", PageRequest.of(0, 10));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getContent().get(0).getTitle()).contains("One Piece");
        }

        @Test
        @DisplayName("Deve retornar vazio quando nenhum tópico corresponde")
        void deveRetornarVazioQuandoNaoCorresponde() {
            var page = forumRepository.searchByTitle("dragon ball", PageRequest.of(0, 10));

            assertThat(page.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo tópico e gerar UUID")
        void devePersistirNovoTopico() {
            var newTopic = ForumTopic.builder()
                    .author(author)
                    .title("Recomendações de manhwa")
                    .content("Quais manhwas vocês recomendam?")
                    .category(ForumCategory.RECOMENDACOES)
                    .build();

            var persisted = forumRepository.save(newTopic);

            assertThat(persisted.getId()).isNotNull();
            assertThat(persisted.getTitle()).isEqualTo("Recomendações de manhwa");
            assertThat(persisted.getCategory()).isEqualTo(ForumCategory.RECOMENDACOES);
        }

        @Test
        @DisplayName("Deve atualizar tópico existente")
        void deveAtualizarTopico() {
            topicGeral.setTitle("Melhor manga de todos os tempos?");
            var updated = forumRepository.save(topicGeral);
            entityManager.flush();

            assertThat(updated.getTitle()).isEqualTo("Melhor manga de todos os tempos?");
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover tópico pelo ID")
        void deveRemoverTopico() {
            forumRepository.deleteById(topicSpoilers.getId());
            entityManager.flush();

            assertThat(forumRepository.findById(topicSpoilers.getId())).isEmpty();
        }
    }
}
