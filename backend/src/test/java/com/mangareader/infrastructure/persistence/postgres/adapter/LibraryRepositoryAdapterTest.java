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

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.user.entity.User;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(LibraryRepositoryAdapter.class)
@DisplayName("LibraryRepositoryAdapter — Integração JPA")
class LibraryRepositoryAdapterTest {

    @Autowired
    private LibraryRepositoryPort libraryRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User user;

    @BeforeEach
    void setUp() {
        user = entityManager.persistAndFlush(
                User.builder()
                        .name("Ruan")
                        .email("ruan@email.com")
                        .passwordHash("hash")
                        .build()
        );

        entityManager.persistAndFlush(SavedManga.builder()
                .user(user).titleId("title-1").name("One Piece")
                .cover("cover1.jpg").type("Mangá").list(ReadingListType.LENDO).build());
        entityManager.persistAndFlush(SavedManga.builder()
                .user(user).titleId("title-2").name("Naruto")
                .cover("cover2.jpg").type("Mangá").list(ReadingListType.CONCLUIDO).build());
        entityManager.persistAndFlush(SavedManga.builder()
                .user(user).titleId("title-3").name("Solo Leveling")
                .cover("cover3.jpg").type("Manhwa").list(ReadingListType.LENDO).build());
    }

    @Nested
    @DisplayName("findByUserId")
    class FindByUserId {

        @Test
        @DisplayName("Deve retornar todos os mangás salvos do usuário")
        void deveRetornarTodosMangasDoUsuario() {
            var result = libraryRepository.findByUserId(user.getId());

            assertThat(result).hasSize(3);
        }

        @Test
        @DisplayName("Deve retornar lista vazia para usuário sem biblioteca")
        void deveRetornarListaVaziaParaUsuarioSemBiblioteca() {
            var result = libraryRepository.findByUserId(UUID.randomUUID());

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Deve retornar página de mangás do usuário")
        void deveRetornarPaginaDeMangasDoUsuario() {
            var page = libraryRepository.findByUserId(user.getId(), PageRequest.of(0, 2));

            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("findByUserIdAndList")
    class FindByUserIdAndList {

        @Test
        @DisplayName("Deve filtrar por tipo de lista de leitura")
        void deveFiltrarPorTipoDeLista() {
            var lendo = libraryRepository.findByUserIdAndList(user.getId(), ReadingListType.LENDO);

            assertThat(lendo).hasSize(2);
            assertThat(lendo).allSatisfy(m ->
                    assertThat(m.getList()).isEqualTo(ReadingListType.LENDO));
        }

        @Test
        @DisplayName("Deve retornar lista vazia para tipo sem mangás")
        void deveRetornarListaVaziaParaTipoSemMangas() {
            var queroLer = libraryRepository.findByUserIdAndList(user.getId(), ReadingListType.QUERO_LER);

            assertThat(queroLer).isEmpty();
        }

        @Test
        @DisplayName("Deve retornar página filtrada por lista com paginação")
        void deveRetornarPaginaFiltradaPorLista() {
            var page = libraryRepository.findByUserIdAndList(user.getId(), ReadingListType.LENDO, PageRequest.of(0, 10));

            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getContent()).allSatisfy(m ->
                    assertThat(m.getList()).isEqualTo(ReadingListType.LENDO));
        }
    }

    @Nested
    @DisplayName("countByUserIdAndList")
    class CountByUserIdAndList {

        @Test
        @DisplayName("Deve contar mangás por tipo de lista")
        void deveContarMangasPorTipoDeLista() {
            assertThat(libraryRepository.countByUserIdAndList(user.getId(), ReadingListType.LENDO)).isEqualTo(2);
            assertThat(libraryRepository.countByUserIdAndList(user.getId(), ReadingListType.CONCLUIDO)).isEqualTo(1);
            assertThat(libraryRepository.countByUserIdAndList(user.getId(), ReadingListType.QUERO_LER)).isZero();
        }
    }

    @Nested
    @DisplayName("findByUserIdAndTitleId")
    class FindByUserIdAndTitleId {

        @Test
        @DisplayName("Deve encontrar mangá específico do usuário")
        void deveEncontrarMangaEspecifico() {
            var result = libraryRepository.findByUserIdAndTitleId(user.getId(), "title-1");

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("One Piece");
        }

        @Test
        @DisplayName("Deve retornar empty para titleId inexistente")
        void deveRetornarEmptyParaTitleIdInexistente() {
            var result = libraryRepository.findByUserIdAndTitleId(user.getId(), "inexistente");

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo mangá na biblioteca")
        void devePersistirNovoManga() {
            var saved = libraryRepository.save(SavedManga.builder()
                    .user(user).titleId("title-4").name("Bleach")
                    .list(ReadingListType.QUERO_LER).build());

            assertThat(saved.getId()).isNotNull();
            assertThat(libraryRepository.findByUserId(user.getId())).hasSize(4);
        }
    }

    @Nested
    @DisplayName("deleteByUserIdAndTitleId")
    class Delete {

        @Test
        @DisplayName("Deve remover mangá da biblioteca")
        void deveRemoverMangaDaBiblioteca() {
            libraryRepository.deleteByUserIdAndTitleId(user.getId(), "title-1");
            entityManager.flush();

            assertThat(libraryRepository.findByUserIdAndTitleId(user.getId(), "title-1")).isEmpty();
            assertThat(libraryRepository.findByUserId(user.getId())).hasSize(2);
        }
    }
}
