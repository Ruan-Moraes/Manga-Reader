package com.mangareader.infrastructure.persistence.postgres.adapter;

import static org.assertj.core.api.Assertions.assertThat;

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

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TagRepositoryAdapter.class)
@DisplayName("TagRepositoryAdapter — Integração JPA")
class TagRepositoryAdapterTest {

    @Autowired
    private TagRepositoryPort tagRepository;

    @Autowired
    private TestEntityManager entityManager;

    @BeforeEach
    void setUp() {
        entityManager.persistAndFlush(Tag.builder().label("Action").build());
        entityManager.persistAndFlush(Tag.builder().label("Adventure").build());
        entityManager.persistAndFlush(Tag.builder().label("Romance").build());
    }

    @Nested
    @DisplayName("findAll")
    class FindAll {

        @Test
        @DisplayName("Deve retornar todas as tags ordenadas por label ASC")
        void deveRetornarTagsOrdenadasPorLabel() {
            var tags = tagRepository.findAll();

            assertThat(tags).hasSize(3);
            assertThat(tags.get(0).getLabel()).isEqualTo("Action");
            assertThat(tags.get(1).getLabel()).isEqualTo("Adventure");
            assertThat(tags.get(2).getLabel()).isEqualTo("Romance");
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar tag pelo ID")
        void deveRetornarTagPeloId() {
            var all = tagRepository.findAll();
            var firstTag = all.get(0);

            var result = tagRepository.findById(firstTag.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getLabel()).isEqualTo(firstTag.getLabel());
        }

        @Test
        @DisplayName("Deve retornar empty para ID inexistente")
        void deveRetornarEmptyParaIdInexistente() {
            assertThat(tagRepository.findById(99999L)).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByLabelContainingIgnoreCase")
    class Search {

        @Test
        @DisplayName("Deve buscar tags por trecho do label (case insensitive)")
        void deveBuscarPorTrechoDoLabel() {
            var result = tagRepository.findByLabelContainingIgnoreCase("ven");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getLabel()).isEqualTo("Adventure");
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando nenhuma tag corresponde")
        void deveRetornarListaVaziaQuandoNaoCorresponde() {
            var result = tagRepository.findByLabelContainingIgnoreCase("xyz");

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Deve buscar paginado por label")
        void deveBuscarPaginadoPorLabel() {
            var page = tagRepository.findByLabelContainingIgnoreCase("a", PageRequest.of(0, 2));

            assertThat(page.getContent()).hasSizeLessThanOrEqualTo(2);
            assertThat(page.getContent()).allSatisfy(tag ->
                    assertThat(tag.getLabel().toLowerCase()).contains("a")
            );
        }
    }

    @Nested
    @DisplayName("findAll paginado")
    class FindAllPaginated {

        @Test
        @DisplayName("Deve retornar página com tamanho correto")
        void deveRetornarPaginaComTamanhoCorreto() {
            var page = tagRepository.findAll(PageRequest.of(0, 2));

            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(3);
            assertThat(page.getTotalPages()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("save e deleteById")
    class SaveAndDelete {

        @Test
        @DisplayName("Deve persistir nova tag")
        void devePersistirNovaTag() {
            var newTag = tagRepository.save(Tag.builder().label("Comédia").build());

            assertThat(newTag.getId()).isNotNull();
            assertThat(tagRepository.findAll()).hasSize(4);
        }

        @Test
        @DisplayName("Deve remover tag pelo ID")
        void deveRemoverTagPeloId() {
            var all = tagRepository.findAll();
            tagRepository.deleteById(all.get(0).getId());
            entityManager.flush();

            assertThat(tagRepository.findAll()).hasSize(2);
        }
    }
}
