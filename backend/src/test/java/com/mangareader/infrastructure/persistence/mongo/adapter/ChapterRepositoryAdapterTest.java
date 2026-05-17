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
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.IndexResolver;
import org.springframework.data.mongodb.core.index.MongoPersistentEntityIndexResolver;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;
import com.mangareader.shared.domain.i18n.LocalizedString;

@DataMongoTest
@ActiveProfiles("test")
@Import({ChapterRepositoryAdapter.class, MongoTestContainerConfig.class})
@DisplayName("ChapterRepositoryAdapter — Integração MongoDB")
class ChapterRepositoryAdapterTest {

    @Autowired
    private ChapterRepositoryPort chapterRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void setUp() {
        mongoTemplate.dropCollection(Chapter.class);

        IndexOperations indexOps = mongoTemplate.indexOps(Chapter.class);
        IndexResolver resolver = new MongoPersistentEntityIndexResolver(
                mongoTemplate.getConverter().getMappingContext());
        resolver.resolveIndexFor(Chapter.class).forEach(indexOps::ensureIndex);

        chapterRepository.saveAll(List.of(
                chapter("t1", "1", "Um"),
                chapter("t1", "2", "Dois"),
                chapter("t1", "3", "Três"),
                chapter("t2", "1", "Outro")));
    }

    private Chapter chapter(String titleId, String number, String title) {
        return Chapter.builder()
                .titleId(titleId)
                .number(number)
                .title(LocalizedString.ofDefault(title))
                .releaseDate("2025-01-01")
                .pages("30")
                .build();
    }

    @Nested
    @DisplayName("findByTitleId")
    class FindByTitleId {
        @Test
        @DisplayName("Retorna página de capítulos do título")
        void retornaPagina() {
            var page = chapterRepository.findByTitleId("t1", PageRequest.of(0, 2));
            assertThat(page.getContent()).hasSize(2);
            assertThat(page.getTotalElements()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("findByTitleIdAndNumber")
    class FindByTitleIdAndNumber {
        @Test
        @DisplayName("Retorna capítulo específico")
        void retornaCapitulo() {
            var ch = chapterRepository.findByTitleIdAndNumber("t1", "2");
            assertThat(ch).isPresent();
            assertThat(ch.get().getTitle().resolve(null)).isEqualTo("Dois");
        }

        @Test
        @DisplayName("Vazio quando não existe")
        void vazioQuandoNaoExiste() {
            assertThat(chapterRepository.findByTitleIdAndNumber("t1", "99")).isEmpty();
        }
    }

    @Nested
    @DisplayName("contagens")
    class Contagens {
        @Test
        @DisplayName("countByTitleId")
        void countByTitleId() {
            assertThat(chapterRepository.countByTitleId("t1")).isEqualTo(3);
            assertThat(chapterRepository.countByTitleId("t2")).isEqualTo(1);
            assertThat(chapterRepository.countByTitleId("nope")).isZero();
        }

        @Test
        @DisplayName("countByTitleIdIn agrega em uma query")
        void countByTitleIdIn() {
            var counts = chapterRepository.countByTitleIdIn(List.of("t1", "t2", "nope"));
            assertThat(counts).containsEntry("t1", 3L).containsEntry("t2", 1L);
            assertThat(counts).doesNotContainKey("nope");
        }

        @Test
        @DisplayName("count total")
        void countTotal() {
            assertThat(chapterRepository.count()).isEqualTo(4);
        }
    }

    @Nested
    @DisplayName("deleteByTitleId")
    class DeleteByTitleId {
        @Test
        @DisplayName("Remove todos os capítulos do título")
        void remove() {
            chapterRepository.deleteByTitleId("t1");
            assertThat(chapterRepository.countByTitleId("t1")).isZero();
            assertThat(chapterRepository.count()).isEqualTo(1);
        }
    }
}
