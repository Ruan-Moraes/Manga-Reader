package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Date;
import java.util.List;

import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.manga.port.ReleaseFeedQueryPort;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;
import com.mangareader.infrastructure.persistence.mongo.migration.V027CreateReleaseFeed;

@DataMongoTest
@ActiveProfiles("test")
@Import({ReleaseFeedQueryAdapter.class, MongoTestContainerConfig.class})
@Tag("testcontainers")
class ReleaseFeedQueryAdapterTest {
    private static final Instant FROM = Instant.parse("2026-07-19T00:00:00Z");
    private static final Instant TO = Instant.parse("2026-07-26T00:00:00Z");

    @Autowired
    private MongoTemplate mongo;

    @Autowired
    private ReleaseFeedQueryPort releases;

    @BeforeEach
    void setUp() {
        mongo.dropCollection("chapters");
        mongo.dropCollection("titles");
        mongo.dropCollection("release_feed_views");

        ObjectId berserk = new ObjectId();
        ObjectId adult = new ObjectId();
        mongo.getCollection("titles").insertMany(List.of(
                new Document("_id", berserk)
                        .append("name", new Document("pt-BR", "Berserk"))
                        .append("cover", "berserk.jpg")
                        .append("adult", false),
                new Document("_id", adult)
                        .append("name", new Document("pt-BR", "Adulto"))
                        .append("adult", true)));
        mongo.getCollection("chapters").insertMany(List.of(
                chapter(berserk, "370", "pt-BR", "2026-07-25T14:00:00Z"),
                chapter(berserk, "369", "en-US", "2026-07-24T14:00:00Z"),
                chapter(adult, "1", "pt-BR", "2026-07-23T14:00:00Z")));
    }

    @Test
    void aggregatesLocalizedTitlesFiltersAdultContentAndPaginates() {
        var query = new ReleaseFeedQueryPort.Query(
                FROM, TO, "bers", "pt-BR", null, true);

        var page = releases.find(query, PageRequest.of(0, 1));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent()).singleElement().satisfies(item -> {
            assertThat(item.chapterNumber()).isEqualTo("370");
            assertThat(item.titleNames()).containsEntry("pt-BR", "Berserk");
            assertThat(item.contentLanguage()).isEqualTo("pt-BR");
        });
        assertThat(releases.findAvailableLanguages(FROM, TO, true))
                .containsExactlyInAnyOrder("pt-BR", "en-US");
    }

    @Test
    void resolvesPublicChapterByIndexedObjectId() {
        String chapterId = mongo.getCollection("chapters").find().first().getObjectId("_id").toHexString();

        assertThat(releases.isPublicChapter(chapterId, TO, true)).isTrue();
        assertThat(releases.isPublicChapter(new ObjectId().toHexString(), TO, true)).isFalse();
    }

    @Test
    void createsAndRollsBackOnlyV027Indexes() {
        var migration = new V027CreateReleaseFeed(mongo);
        migration.execute();

        assertThat(indexNames("release_feed_views"))
                .contains("idx_release_feed_views_user_chapter", "idx_release_feed_views_chapter");
        assertThat(indexNames("chapters"))
                .contains("idx_chapter_release_feed", "idx_chapter_release_feed_language");

        migration.rollback();

        assertThat(indexNames("release_feed_views"))
                .doesNotContain("idx_release_feed_views_user_chapter", "idx_release_feed_views_chapter");
    }

    private Document chapter(ObjectId titleId, String number, String language, String publishedAt) {
        return new Document("_id", new ObjectId())
                .append("titleId", titleId.toHexString())
                .append("number", number)
                .append("title", new Document("pt-BR", "Capítulo " + number))
                .append("status", "PUBLISHED")
                .append("deletedAt", null)
                .append("publishedAt", Date.from(Instant.parse(publishedAt)))
                .append("contentLanguage", language);
    }

    private List<String> indexNames(String collection) {
        return mongo.indexOps(collection).getIndexInfo().stream()
                .map(index -> index.getName())
                .toList();
    }
}
