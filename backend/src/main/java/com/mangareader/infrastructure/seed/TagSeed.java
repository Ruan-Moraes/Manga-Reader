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
                tag("Ação", "Action", "Acción"),
                tag("Aventura", "Adventure", "Aventura"),
                tag("Comédia", "Comedy", "Comedia"),
                tag("Drama", "Drama", "Drama"),
                tag("Fantasia", "Fantasy", "Fantasía"),
                tag("Ficção Científica", "Science Fiction", "Ciencia Ficción"),
                tag("Horror", "Horror", "Horror"),
                tag("Mistério", "Mystery", "Misterio"),
                tag("Romance", "Romance", "Romance"),
                tag("Seinen", "Seinen", "Seinen"),
                tag("Shoujo", "Shoujo", "Shoujo"),
                tag("Shounen", "Shounen", "Shounen"),
                tag("Slice of Life", "Slice of Life", "Slice of Life"),
                tag("Sobrenatural", "Supernatural", "Sobrenatural"),
                tag("Suspense", "Thriller", "Suspense"),
                tag("Esportes", "Sports", "Deportes"),
                tag("Artes Marciais", "Martial Arts", "Artes Marciales"),
                tag("Histórico", "Historical", "Histórico"),
                tag("Culinária", "Culinary", "Culinaria"),
                tag("Urbano", "Urban", "Urbano"),
                tag("RPG", "RPG", "RPG"),
                tag("Escolar", "School", "Escolar"),
                tag("Mecha", "Mecha", "Mecha"),
                tag("Musical", "Musical", "Musical")
        );

        tagRepository.saveAll(tags);

        log.info("✓ {} tags de demonstração criadas.", tags.size());
    }

    private static Tag tag(String pt, String en, String es) {
        return Tag.builder()
                .label(LocalizedString.of(Map.of("pt-BR", pt, "en-US", en, "es-ES", es)))
                .build();
    }
}
