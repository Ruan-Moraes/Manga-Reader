package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.Chapter;
import com.mangareader.infrastructure.persistence.mongo.repository.TitleMongoRepository;

@DataMongoTest
@Testcontainers
@ActiveProfiles("test")
@Import(TitleRepositoryAdapter.class)
@DisplayName("TitleRepositoryAdapter — Integração MongoDB")
class TitleRepositoryAdapterTest {

    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:8.0");

    @DynamicPropertySource
    static void setProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongoDBContainer::getReplicaSetUrl);
    }

    @Autowired
    private TitleRepositoryPort titleRepository;

    @Autowired
    private TitleMongoRepository mongoRepository;

    private Title title1;
    private Title title2;
    private Title title3;

    @BeforeEach
    void setUp() {
        mongoRepository.deleteAll();

        title1 = mongoRepository.save(Title.builder()
                .name("Naruto")
                .type("Manga")
                .cover("naruto-cover.jpg")
                .synopsis("A ninja's journey to become Hokage")
                .genres(List.of("Action", "Adventure", "Shounen"))
                .popularity("HIGH")
                .score("8.5")
                .author("Masashi Kishimoto")
                .artist("Masashi Kishimoto")
                .publisher("Shueisha")
                .chapters(List.of(
                        new Chapter("1", "Uzumaki Naruto", "2000-01-01", "52"),
                        new Chapter("2", "Konohamaru", "2000-01-08", "24")
                ))
                .build());

        title2 = mongoRepository.save(Title.builder()
                .name("One Piece")
                .type("Manga")
                .cover("onepiece-cover.jpg")
                .synopsis("A pirate's quest for the ultimate treasure")
                .genres(List.of("Action", "Adventure", "Comedy"))
                .popularity("VERY_HIGH")
                .score("9.0")
                .author("Eiichiro Oda")
                .artist("Eiichiro Oda")
                .publisher("Shueisha")
                .build());

        title3 = mongoRepository.save(Title.builder()
                .name("Romantic Killer")
                .type("Manga")
                .cover("romantic-killer-cover.jpg")
                .synopsis("A girl forced into romantic situations by a wizard")
                .genres(List.of("Romance", "Comedy"))
                .popularity("MEDIUM")
                .score("7.5")
                .author("Wataru Momose")
                .build());
    }

    @Nested
    @DisplayName("findAll")
    class FindAll {

        @Test
        @DisplayName("Deve retornar todos os títulos")
        void deveRetornarTodosOsTitulos() {
            var result = titleRepository.findAll();

            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando não há títulos")
        void deveRetornarListaVaziaQuandoNaoHaTitulos() {
            mongoRepository.deleteAll();

            assertThat(titleRepository.findAll()).isEmpty();
        }
    }

    @Nested
    @DisplayName("findAll paginado")
    class FindAllPaginated {

        @Test
        @DisplayName("Deve retornar página com tamanho correto")
        void deveRetornarPaginaComTamanhoCorreto() {
            var page = titleRepository.findAll(PageRequest.of(0, 2));

            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(3);
            assertThat(page.getTotalPages()).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve retornar segunda página")
        void deveRetornarSegundaPagina() {
            var page = titleRepository.findAll(PageRequest.of(1, 2));

            assertThat(page.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("Deve retornar título pelo ID")
        void deveRetornarTituloPeloId() {
            var result = titleRepository.findById(title1.getId());

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Naruto");
            assertThat(result.get().getGenres()).containsExactly("Action", "Adventure", "Shounen");
            assertThat(result.get().getChapters()).hasSize(2);
        }

        @Test
        @DisplayName("Deve retornar empty para ID inexistente")
        void deveRetornarEmptyParaIdInexistente() {
            assertThat(titleRepository.findById("nonexistent-id")).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByGenresContaining")
    class FindByGenresContaining {

        @Test
        @DisplayName("Deve retornar títulos que contêm o gênero especificado")
        void deveRetornarTitulosComGeneroEspecificado() {
            var result = titleRepository.findByGenresContaining("Action");

            assertThat(result).hasSize(2);
            assertThat(result).extracting(Title::getName)
                    .containsExactlyInAnyOrder("Naruto", "One Piece");
        }

        @Test
        @DisplayName("Deve retornar lista vazia para gênero inexistente")
        void deveRetornarListaVaziaParaGeneroInexistente() {
            assertThat(titleRepository.findByGenresContaining("Horror")).isEmpty();
        }

        @Test
        @DisplayName("Deve retornar paginado por gênero")
        void deveRetornarPaginadoPorGenero() {
            var page = titleRepository.findByGenresContaining("Action", PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("searchByName")
    class SearchByName {

        @Test
        @DisplayName("Deve buscar títulos por nome (case insensitive)")
        void deveBuscarPorNomeCaseInsensitive() {
            var result = titleRepository.searchByName("naruto");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Naruto");
        }

        @Test
        @DisplayName("Deve buscar por trecho do nome")
        void deveBuscarPorTrechoDoNome() {
            var result = titleRepository.searchByName("roman");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Romantic Killer");
        }

        @Test
        @DisplayName("Deve retornar lista vazia para nome inexistente")
        void deveRetornarListaVaziaParaNomeInexistente() {
            assertThat(titleRepository.searchByName("Dragon Ball")).isEmpty();
        }

        @Test
        @DisplayName("Deve buscar paginado por nome")
        void deveBuscarPaginadoPorNome() {
            var page = titleRepository.searchByName("a", PageRequest.of(0, 10));

            assertThat(page.getContent()).isNotEmpty();
            assertThat(page.getContent()).allSatisfy(t ->
                    assertThat(t.getName().toLowerCase()).contains("a")
            );
        }
    }

    @Nested
    @DisplayName("findByGenresContainingAll")
    class FindByGenresContainingAll {

        @Test
        @DisplayName("Deve retornar títulos que contêm todos os gêneros")
        void deveRetornarTitulosComTodosOsGeneros() {
            var result = titleRepository.findByGenresContainingAll(List.of("Action", "Adventure"));

            assertThat(result).hasSize(2);
        }

        @Test
        @DisplayName("Deve retornar vazio quando nenhum título tem todos os gêneros")
        void deveRetornarVazioQuandoNenhumTituloTemTodosOsGeneros() {
            var result = titleRepository.findByGenresContainingAll(List.of("Action", "Romance"));

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Deve retornar paginado por múltiplos gêneros")
        void deveRetornarPaginadoPorMultiplosGeneros() {
            var page = titleRepository.findByGenresContainingAll(
                    List.of("Action", "Adventure"), PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo título com ID gerado")
        void devePersistirNovoTitulo() {
            var newTitle = titleRepository.save(Title.builder()
                    .name("Bleach")
                    .type("Manga")
                    .genres(List.of("Action", "Supernatural"))
                    .author("Tite Kubo")
                    .build());

            assertThat(newTitle.getId()).isNotNull();
            assertThat(titleRepository.findAll()).hasSize(4);
        }

        @Test
        @DisplayName("Deve atualizar título existente")
        void deveAtualizarTituloExistente() {
            title1.setScore("9.0");
            titleRepository.save(title1);

            var updated = titleRepository.findById(title1.getId());
            assertThat(updated).isPresent();
            assertThat(updated.get().getScore()).isEqualTo("9.0");
        }
    }

    @Nested
    @DisplayName("deleteById")
    class DeleteById {

        @Test
        @DisplayName("Deve remover título pelo ID")
        void deveRemoverTituloPeloId() {
            titleRepository.deleteById(title1.getId());

            assertThat(titleRepository.findById(title1.getId())).isEmpty();
            assertThat(titleRepository.findAll()).hasSize(2);
        }
    }
}
