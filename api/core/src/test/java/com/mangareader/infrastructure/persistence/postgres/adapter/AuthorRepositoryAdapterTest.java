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

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.domain.author.entity.Author;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(AuthorRepositoryAdapter.class)
@DisplayName("AuthorRepositoryAdapter — Integração JPA")
class AuthorRepositoryAdapterTest {

    @Autowired
    private AuthorRepositoryPort authorRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Author oda;

    @BeforeEach
    void setUp() {
        oda = entityManager.persistAndFlush(
                Author.builder().name("Eiichiro Oda").slug("eiichiro-oda").nationality("JP").build());
        entityManager.persistAndFlush(
                Author.builder().name("Kentaro Miura").slug("kentaro-miura").build());
    }

    @Nested
    @DisplayName("findBySlug / existsBySlug")
    class Slug {

        @Test
        @DisplayName("Deve retornar autor pelo slug")
        void deveRetornarPorSlug() {
            var result = authorRepository.findBySlug("eiichiro-oda");

            assertThat(result).isPresent();
            assertThat(result.get().getName()).isEqualTo("Eiichiro Oda");
        }

        @Test
        @DisplayName("existsBySlug deve refletir presença")
        void existsBySlug() {
            assertThat(authorRepository.existsBySlug("eiichiro-oda")).isTrue();
            assertThat(authorRepository.existsBySlug("desconhecido")).isFalse();
        }
    }

    @Nested
    @DisplayName("save")
    class Save {

        @Test
        @DisplayName("Deve persistir novo autor e gerar id + timestamps")
        void devePersistir() {
            var persisted = authorRepository.save(
                    Author.builder().name("Sui Ishida").slug("sui-ishida").build());
            entityManager.flush();

            assertThat(persisted.getId()).isNotNull();
            assertThat(persisted.getCreatedAt()).isNotNull();
            assertThat(persisted.getUpdatedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("searchByName")
    class Search {

        @Test
        @DisplayName("Deve filtrar por nome ignorando caixa")
        void deveFiltrarPorNome() {
            var page = authorRepository.searchByName("oda", PageRequest.of(0, 10));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getContent().get(0).getId()).isEqualTo(oda.getId());
        }

        @Test
        @DisplayName("Deve retornar vazio para query em branco")
        void deveRetornarVazioParaBranco() {
            assertThat(authorRepository.searchByName("  ", PageRequest.of(0, 10)).getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("findAll / count")
    class FindAll {

        @Test
        @DisplayName("Deve paginar e contar autores")
        void devePaginar() {
            var page = authorRepository.findAll(PageRequest.of(0, 1));

            assertThat(page.getContent()).hasSize(1);
            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(authorRepository.count()).isEqualTo(2);
        }
    }
}
