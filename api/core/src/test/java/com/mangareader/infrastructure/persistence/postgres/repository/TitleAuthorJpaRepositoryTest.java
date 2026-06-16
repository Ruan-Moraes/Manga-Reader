package com.mangareader.infrastructure.persistence.postgres.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.domain.author.entity.Author;
import com.mangareader.domain.author.entity.TitleAuthor;
import com.mangareader.domain.author.valueobject.AuthorRole;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("TitleAuthorJpaRepository — Integração JPA")
class TitleAuthorJpaRepositoryTest {

    @Autowired
    private TitleAuthorJpaRepository titleAuthorRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Author oda;

    @BeforeEach
    void setUp() {
        oda = entityManager.persistAndFlush(
                Author.builder().name("Eiichiro Oda").slug("eiichiro-oda").build());
        entityManager.persistAndFlush(TitleAuthor.builder()
                .titleId("title-mongo-1").author(oda).role(AuthorRole.AUTHOR).build());
    }

    @Test
    @DisplayName("findByTitleId deve carregar junções com autor")
    void findByTitleId() {
        var result = titleAuthorRepository.findByTitleId("title-mongo-1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getAuthor().getName()).isEqualTo("Eiichiro Oda");
        assertThat(result.get(0).getRole()).isEqualTo(AuthorRole.AUTHOR);
    }

    @Test
    @DisplayName("existsByTitleIdAndAuthorIdAndRole deve refletir presença por role")
    void existsByTitleIdAndAuthorIdAndRole() {
        assertThat(titleAuthorRepository
                .existsByTitleIdAndAuthorIdAndRole("title-mongo-1", oda.getId(), AuthorRole.AUTHOR)).isTrue();
        assertThat(titleAuthorRepository
                .existsByTitleIdAndAuthorIdAndRole("title-mongo-1", oda.getId(), AuthorRole.ARTIST)).isFalse();
    }

    @Test
    @DisplayName("Mesmo autor pode ter linhas AUTHOR e ARTIST no mesmo título")
    void permiteAuthorEArtistDoMesmoAutor() {
        entityManager.persistAndFlush(TitleAuthor.builder()
                .titleId("title-mongo-1").author(oda).role(AuthorRole.ARTIST).build());

        assertThat(titleAuthorRepository.findByTitleId("title-mongo-1")).hasSize(2);
    }
}
