package com.mangareader.infrastructure.seed;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.infrastructure.persistence.mongo.repository.RatingMongoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class RatingSeed implements EntitySeeder {
    private static final int TOTAL_TITLES = 8;

    private static final String[] USER_NAMES = {
            "Ana", "Carlos", "Mika", "Rui", "João", "Ester", "Nina", "Leo", "Sakura", "Dante"
    };

    private static final String[] RATING_COMMENTS = {
            "Arte impecável e história viciante.",
            "Ritmo bom, mas alguns capítulos são lentos.",
            "Gostei muito do desenvolvimento dos personagens.",
            "Leitura leve para maratonar no fim de semana.",
            "Final do último arco foi excelente.",
            "Tradução boa e capítulos bem consistentes.",
            "Recomendo para quem gosta do gênero.",
            "Cenários maravilhosos e painéis detalhados."
    };

    private final RatingMongoRepository ratingRepository;

    @Override
    public int getOrder() {
        return 4;
    }

    @Override
    public void seed() {
        if (ratingRepository.count() > 0) {
            log.info("Avaliações já existem — seed de ratings ignorado.");

            return;
        }

        for (int titleIdx = 0; titleIdx < TOTAL_TITLES; titleIdx++) {
            String titleId = String.valueOf(titleIdx + 1);
            int amount = 3 + ((titleIdx * 7 + 3) % 8);

            for (int i = 0; i < amount; i++) {
                int seed = titleIdx * 100 + i;

                double fun = Math.max(1.0, Math.min(5.0, ((seed) % 9 + 1) * 0.5));
                double art = Math.max(1.0, Math.min(5.0, ((seed + 3) % 9 + 1) * 0.5));
                double storyline = Math.max(1.0, Math.min(5.0, ((seed + 6) % 9 + 1) * 0.5));
                double characters = Math.max(1.0, Math.min(5.0, ((seed + 9) % 9 + 1) * 0.5));
                double originality = Math.max(1.0, Math.min(5.0, ((seed + 12) % 9 + 1) * 0.5));
                double pacing = Math.max(1.0, Math.min(5.0, ((seed + 15) % 9 + 1) * 0.5));
                double overall = Math.round((fun + art + storyline + characters + originality + pacing) / 6.0 * 10.0) / 10.0;

                MangaRating rating = MangaRating.builder()
                        .id(titleId + "-" + i)
                        .titleId(titleId)
                        .userId("seed-rating-" + seed)
                        .userName(USER_NAMES[seed % USER_NAMES.length])
                        .funRating(fun)
                        .artRating(art)
                        .storylineRating(storyline)
                        .charactersRating(characters)
                        .originalityRating(originality)
                        .pacingRating(pacing)
                        .overallRating(overall)
                        .comment(seed % 3 != 0 ? RATING_COMMENTS[seed % RATING_COMMENTS.length] : null)
                        .build();

                ratingRepository.save(rating);
            }
        }

        log.info("✓ Avaliações de demonstração criadas para {} títulos.", TOTAL_TITLES);
    }
}
