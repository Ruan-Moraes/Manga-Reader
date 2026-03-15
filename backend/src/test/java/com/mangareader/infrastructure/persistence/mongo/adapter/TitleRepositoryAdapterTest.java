package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;

@DataMongoTest
@ActiveProfiles("test")
@Import({TitleRepositoryAdapter.class, MongoTestContainerConfig.class})
@DisplayName("TitleRepositoryAdapter — Integração MongoDB")
class TitleRepositoryAdapterTest {
    @Autowired
    private TitleRepositoryPort titleRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private Title naruto;
    private Title onePiece;
    private Title deathNote;

    @BeforeEach
    void setUp() {
        mongoTemplate.dropCollection(Title.class);

        naruto = mongoTemplate.save(Title.builder()
                .name("Naruto")
                .type("manga")
                .genres(List.of("Action", "Adventure"))
                .author("Masashi Kishimoto")
                .createdAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .updatedAt(LocalDateTime.of(2024, 1, 1, 0, 0))
                .build());

        onePiece = mongoTemplate.save(Title.builder()
                .name("One Piece")
                .type("manga")
                .genres(List.of("Action", "Adventure", "Comedy"))
                .author("Eiichiro Oda")
                .createdAt(LocalDateTime.of(2024, 2, 1, 0, 0))
                .updatedAt(LocalDateTime.of(2024, 2, 1, 0, 0))
                .build());

        deathNote = mongoTemplate.save(Title.builder()
                .name("Death Note")
                .type("manga")
                .genres(List.of("Mystery", "Thriller"))
                .author("Tsugumi Ohba")
                .createdAt(LocalDateTime.of(2024, 3, 1, 0, 0))
                .updatedAt(LocalDateTime.of(2024, 3, 1, 0, 0))
                .build());
    }

    @Nested
    @DisplayName("findAll")
    class FindAll {
        @Test
        @DisplayName("Deve retornar todos os títulos")
        void deveRetornarTodosTitulos() {
            var result = titleRepository.findAll();

            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("Deve retornar página de títulos")
        void deveRetornarPaginaDeTitulos() {
            var page = titleRepository.findAll(PageRequest.of(0, 2));

            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(3);
            assertThat(page.getTotalPages()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {
        @Test
        @DisplayName("Deve retornar título quando ID existe")
        void deveRetornarTituloQuandoIdExiste() {
            var result = titleRepository.findById(naruto.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Naruto");
        }

        @Test
        @DisplayName("Deve retornar empty quando ID não existe")
        void deveRetornarEmptyQuandoIdNaoExiste() {
            var result = titleRepository.findById("id-inexistente");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByGenresContaining")
    class FindByGenresContaining {
        @Test
        @DisplayName("Deve retornar títulos que contêm o gênero")
        void deveRetornarTitulosComGenero() {
            var result = titleRepository.findByGenresContaining("Action");

            assertThat(result).hasSize(2)
                    .extracting(Title::getName)
                    .containsExactlyInAnyOrder("Naruto", "One Piece");
        }

        @Test
        @DisplayName("Deve retornar página de títulos por gênero")
        void deveRetornarPaginaPorGenero() {
            var page = titleRepository.findByGenresContaining("Action", PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("searchByName")
    class SearchByName {
        @Test
        @DisplayName("Deve buscar por nome case-insensitive")
        void deveBuscarPorNomeCaseInsensitive() {
            var result = titleRepository.searchByName("naruto");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Naruto");
        }

        @Test
        @DisplayName("Deve buscar por nome parcial paginado")
        void deveBuscarPorNomeParcialPaginado() {
            var page = titleRepository.searchByName("note", PageRequest.of(0, 10));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getContent().get(0).getName()).isEqualTo("Death Note");
        }

        @Test
        @DisplayName("Deve retornar vazio para nome inexistente")
        void deveRetornarVazioParaNomeInexistente() {
            var result = titleRepository.searchByName("Dragon Ball");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByGenresContainingAll")
    class FindByGenresContainingAll {
        @Test
        @DisplayName("Deve retornar títulos que contêm todos os gêneros")
        void deveRetornarTitulosComTodosGeneros() {
            var result = titleRepository.findByGenresContainingAll(List.of("Action", "Comedy"));

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("One Piece");
        }

        @Test
        @DisplayName("Deve retornar página com todos os gêneros")
        void deveRetornarPaginaComTodosGeneros() {
            var page = titleRepository.findByGenresContainingAll(
                    List.of("Action", "Adventure"), PageRequest.of(0, 10));

            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("save")
    class Save {
        @Test
        @DisplayName("Deve persistir novo título e gerar ID")
        void devePersistirNovoTitulo() {
            var newTitle = Title.builder()
                    .name("Bleach")
                    .type("manga")
                    .genres(List.of("Action", "Supernatural"))
                    .author("Tite Kubo")
                    .createdAt(LocalDateTime.now())
                    .build();

            var saved = titleRepository.save(newTitle);

            assertThat(saved.getId()).isNotNull();
            assertThat(saved.getName()).isEqualTo("Bleach");
        }

        @Test
        @DisplayName("Deve atualizar título existente")
        void deveAtualizarTituloExistente() {
            naruto.setRatingAverage(3.5);

            titleRepository.save(naruto);

            var updated = titleRepository.findById(naruto.getId());

            assertThat(updated).isPresent();

            assertThat(updated.get().getRatingAverage()).isEqualTo(3.5);
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {
        @Test
        @DisplayName("Deve remover o título")
        void deveRemoverTitulo() {
            titleRepository.deleteById(naruto.getId());

            assertThat(titleRepository.findById(naruto.getId())).isEmpty();
            assertThat(titleRepository.findAll()).hasSize(2);
        }
    }
}
