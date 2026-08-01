package com.mangareader.infrastructure.persistence.mongo.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.mongo.DataMongoTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.mangareader.application.manga.port.TitleReferenceMatch;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.TitleSearchMatchType;
import com.mangareader.infrastructure.persistence.mongo.MongoTestContainerConfig;
import com.mangareader.infrastructure.persistence.mongo.callback.TitleSearchIndexCallback;
import com.mangareader.shared.domain.i18n.LocalizedString;

@DataMongoTest
@ActiveProfiles("test")
@Import({
        TitleRepositoryAdapter.class,
        TitleSearchIndexCallback.class,
        MongoTestContainerConfig.class
})
@DisplayName("TitleRepositoryAdapter.searchGlobal — MongoDB")
@Tag("testcontainers")
class TitleGlobalSearchMongoTest {

    @Autowired
    private TitleRepositoryPort repository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @BeforeEach
    void clean() {
        mongoTemplate.dropCollection(Title.class);
    }

    @Test
    @DisplayName("Ordena todas as fontes, deduplica, pagina e filtra conteúdo adulto")
    void ranksAllSourcesAndPaginates() {
        var exact = save(names("Herói", "Hero"), "90", false);
        var prefix = save(names("Hero Land", "Hero Land"), "20", false);
        var contains = save(names("Meu Hero Favorito", "My Favorite Hero"), "80", false);
        var alternate = save(names("Academia", "Hero Academy"), "70", false);
        var author = save(names("Obra de Autor", "Author Work"), "60", false);
        var artist = save(names("Obra de Artista", "Artist Work"), "50", false);
        var group = save(names("Obra do Grupo", "Group Work"), "40", false);
        save(names("Hero Adulto", "Adult Hero"), "100", true);

        Map<String, TitleReferenceMatch> relations = new LinkedHashMap<>();
        relations.put(author.getId(), new TitleReferenceMatch(
                author.getId(), TitleSearchMatchType.AUTHOR, "Hero Author"));
        relations.put(artist.getId(), new TitleReferenceMatch(
                artist.getId(), TitleSearchMatchType.ARTIST, "Hero Artist"));
        relations.put(group.getId(), new TitleReferenceMatch(
                group.getId(), TitleSearchMatchType.GROUP, "Hero Scans"));

        var firstPage = repository.searchGlobal(
                "hero", List.of("pt-BR"), relations, true, PageRequest.of(0, 4));
        var secondPage = repository.searchGlobal(
                "hero", List.of("pt-BR"), relations, true, PageRequest.of(1, 4));

        assertThat(firstPage.getTotalElements()).isEqualTo(7);
        assertThat(firstPage.getContent()).extracting(hit -> hit.title().getId())
                .containsExactly(exact.getId(), prefix.getId(), contains.getId(), alternate.getId());
        assertThat(firstPage.getContent()).extracting(hit -> hit.matchedBy())
                .containsExactly(
                        TitleSearchMatchType.TITLE,
                        TitleSearchMatchType.TITLE,
                        TitleSearchMatchType.TITLE,
                        TitleSearchMatchType.ALTERNATE_TITLE);
        assertThat(secondPage.getContent()).extracting(hit -> hit.matchedBy())
                .containsExactly(
                        TitleSearchMatchType.AUTHOR,
                        TitleSearchMatchType.ARTIST,
                        TitleSearchMatchType.GROUP);
    }

    private Title save(LocalizedString names, String popularity, boolean adult) {
        return repository.save(Title.builder()
                .name(names)
                .popularity(popularity)
                .adult(adult)
                .build());
    }

    private static LocalizedString names(String ptBr, String enUs) {
        return LocalizedString.of(Map.of("pt-BR", ptBr, "en-US", enUs));
    }
}
