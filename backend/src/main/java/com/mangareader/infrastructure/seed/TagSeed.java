package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.category.entity.Tag;
import com.mangareader.infrastructure.persistence.postgres.repository.TagJpaRepository;

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
                Tag.builder().label("Ação").build(),
                Tag.builder().label("Aventura").build(),
                Tag.builder().label("Comédia").build(),
                Tag.builder().label("Drama").build(),
                Tag.builder().label("Fantasia").build(),
                Tag.builder().label("Ficção Científica").build(),
                Tag.builder().label("Horror").build(),
                Tag.builder().label("Mistério").build(),
                Tag.builder().label("Romance").build(),
                Tag.builder().label("Seinen").build(),
                Tag.builder().label("Shoujo").build(),
                Tag.builder().label("Shounen").build(),
                Tag.builder().label("Slice of Life").build(),
                Tag.builder().label("Sobrenatural").build(),
                Tag.builder().label("Suspense").build(),
                Tag.builder().label("Esportes").build(),
                Tag.builder().label("Artes Marciais").build(),
                Tag.builder().label("Histórico").build(),
                Tag.builder().label("Culinária").build(),
                Tag.builder().label("Urbano").build(),
                Tag.builder().label("RPG").build(),
                Tag.builder().label("Escolar").build(),
                Tag.builder().label("Mecha").build(),
                Tag.builder().label("Musical").build()
        );

        tagRepository.saveAll(tags);

        log.info("✓ {} tags de demonstração criadas.", tags.size());
    }
}
