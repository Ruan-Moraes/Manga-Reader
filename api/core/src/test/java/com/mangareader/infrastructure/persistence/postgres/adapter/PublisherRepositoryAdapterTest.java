package com.mangareader.infrastructure.persistence.postgres.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.publisher.port.PublisherRepositoryPort;
import com.mangareader.domain.publisher.entity.Publisher;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(PublisherRepositoryAdapter.class)
@DisplayName("PublisherRepositoryAdapter — Integração JPA")
class PublisherRepositoryAdapterTest {

    @Autowired
    private PublisherRepositoryPort publisherRepository;

    @Autowired
    private TestEntityManager entityManager;

    @BeforeEach
    void setUp() {
        entityManager.persistAndFlush(
                Publisher.builder().name("Shueisha").slug("shueisha").country("JP").build());
        entityManager.persistAndFlush(
                Publisher.builder().name("Kodansha").slug("kodansha").country("JP").build());
    }

    @Test
    @DisplayName("Deve retornar editora pelo slug")
    void deveRetornarPorSlug() {
        var result = publisherRepository.findBySlug("shueisha");

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Shueisha");
    }

    @Test
    @DisplayName("Deve persistir nova editora e gerar id + timestamps")
    void devePersistir() {
        var persisted = publisherRepository.save(
                Publisher.builder().name("Square Enix").slug("square-enix").build());
        entityManager.flush();

        assertThat(persisted.getId()).isNotNull();
        assertThat(persisted.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Deve filtrar por nome ignorando caixa")
    void deveFiltrarPorNome() {
        var page = publisherRepository.searchByName("kodan", PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getName()).isEqualTo("Kodansha");
    }

    @Test
    @DisplayName("Deve paginar e contar editoras")
    void devePaginar() {
        var page = publisherRepository.findAll(PageRequest.of(0, 1));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(publisherRepository.count()).isEqualTo(2);
    }
}
