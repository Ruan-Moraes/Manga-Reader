package com.mangareader.infrastructure.seed;

import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.category.entity.Tag;
import com.mangareader.infrastructure.persistence.postgres.repository.TagJpaRepository;
import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class TagSeed implements EntitySeeder {
    private final TagJpaRepository tagRepository;

    @Override
    public int getOrder() {
        return 10;
    }

    @Override
    public void seed() {
        if (tagRepository.count() > 0) {
            log.info("Tags já existem — seed de tags ignorado.");

            return;
        }

        var tags = List.of(
                tag("ACTION", "Ação", "Action", "Acción"),
                tag("ADVENTURE", "Aventura", "Adventure", "Aventura"),
                tag("COMEDY", "Comédia", "Comedy", "Comedia"),
                tag("DRAMA", "Drama", "Drama", "Drama"),
                tag("FANTASY", "Fantasia", "Fantasy", "Fantasía"),
                tag("SCIENCE_FICTION", "Ficção Científica", "Science Fiction", "Ciencia Ficción"),
                tag("HORROR", "Horror", "Horror", "Horror"),
                tag("MYSTERY", "Mistério", "Mystery", "Misterio"),
                tag("ROMANCE", "Romance", "Romance", "Romance"),
                tag("SEINEN", "Seinen", "Seinen", "Seinen"),
                tag("SHOUJO", "Shoujo", "Shoujo", "Shoujo"),
                tag("SHOUNEN", "Shounen", "Shounen", "Shounen"),
                tag("SLICE_OF_LIFE", "Slice of Life", "Slice of Life", "Slice of Life"),
                tag("SUPERNATURAL", "Sobrenatural", "Supernatural", "Sobrenatural"),
                tag("THRILLER", "Suspense", "Thriller", "Suspense"),
                tag("SPORTS", "Esportes", "Sports", "Deportes"),
                tag("MARTIAL_ARTS", "Artes Marciais", "Martial Arts", "Artes Marciales"),
                tag("HISTORICAL", "Histórico", "Historical", "Histórico"),
                tag("CULINARY", "Culinária", "Culinary", "Culinaria"),
                tag("URBAN", "Urbano", "Urban", "Urbano"),
                tag("RPG", "RPG", "RPG", "RPG"),
                tag("SCHOOL", "Escolar", "School", "Escolar"),
                tag("MECHA", "Mecha", "Mecha", "Mecha"),
                tag("MUSICAL", "Musical", "Musical", "Musical")
        );

        tagRepository.saveAll(tags);

        log.info("✓ {} tags de demonstração criadas.", tags.size());
    }

    private static Tag tag(String slug, String pt, String en, String es) {
        return Tag.builder()
                .slug(slug)
                .label(LocalizedString.of(Map.of("pt-BR", pt, "en-US", en, "es-ES", es)))
                .build();
    }
}
