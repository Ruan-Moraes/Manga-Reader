package com.mangareader.mock.rating;

import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.mock.title.TitleMock;
import com.mangareader.mock.user.UserMock;

import java.time.LocalDateTime;
import java.util.List;

public final class RatingMock {

    private RatingMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final String RATING_1_ID = "rating-1";
    public static final String RATING_2_ID = "rating-2";
    public static final String RATING_3_ID = "rating-3";
    public static final String RATING_4_ID = "rating-4";
    public static final String RATING_5_ID = "rating-5";
    public static final String RATING_6_ID = "rating-6";

    // ── Single entities ────────────────────────────────────────────────────

    public static MangaRating highRating() {
        return MangaRating.builder()
                .id(RATING_1_ID)
                .titleId(TitleMock.TITLE_1_ID)
                .userId(UserMock.READER_ID.toString())
                .userName("Leitor Demo")
                .funRating(5.0)
                .artRating(5.0)
                .storylineRating(4.5)
                .charactersRating(5.0)
                .originalityRating(4.0)
                .pacingRating(4.5)
                .overallRating(4.7)
                .comment("Obra-prima absoluta! A arte é deslumbrante e a história prende do começo ao fim.")
                .createdAt(LocalDateTime.of(2025, 1, 10, 14, 30))
                .build();
    }

    public static MangaRating averageRating() {
        return MangaRating.builder()
                .id(RATING_2_ID)
                .titleId(TitleMock.TITLE_2_ID)
                .userId(UserMock.MOD_ID.toString())
                .userName("Sakura Mendes")
                .funRating(3.0)
                .artRating(3.5)
                .storylineRating(3.0)
                .charactersRating(2.5)
                .originalityRating(3.0)
                .pacingRating(3.0)
                .overallRating(3.0)
                .comment("Uma obra decente, mas nada que se destaque.")
                .createdAt(LocalDateTime.of(2025, 1, 15, 10, 0))
                .build();
    }

    public static MangaRating lowRating() {
        return MangaRating.builder()
                .id(RATING_3_ID)
                .titleId(TitleMock.TITLE_3_ID)
                .userId(UserMock.POSTER_ID.toString())
                .userName("Haru Yamamoto")
                .funRating(1.5)
                .artRating(2.0)
                .storylineRating(1.0)
                .charactersRating(1.5)
                .originalityRating(2.0)
                .pacingRating(1.0)
                .overallRating(1.5)
                .comment("Não consegui passar do terceiro capítulo. Ritmo muito lento.")
                .createdAt(LocalDateTime.of(2025, 2, 1, 9, 0))
                .build();
    }

    public static MangaRating perfectScore() {
        return MangaRating.builder()
                .id(RATING_4_ID)
                .titleId(TitleMock.TITLE_4_ID)
                .userId(UserMock.ADMIN_ID.toString())
                .userName("Ana Beatriz")
                .funRating(5.0)
                .artRating(5.0)
                .storylineRating(5.0)
                .charactersRating(5.0)
                .originalityRating(5.0)
                .pacingRating(5.0)
                .overallRating(5.0)
                .comment("Perfeição. Cada página é uma obra de arte.")
                .createdAt(LocalDateTime.of(2025, 2, 10, 16, 0))
                .build();
    }

    public static MangaRating withoutComment() {
        return MangaRating.builder()
                .id(RATING_5_ID)
                .titleId(TitleMock.TITLE_5_ID)
                .userId(UserMock.READER_ID.toString())
                .userName("Leitor Demo")
                .funRating(4.0)
                .artRating(3.5)
                .storylineRating(4.0)
                .charactersRating(3.5)
                .originalityRating(3.0)
                .pacingRating(4.0)
                .overallRating(3.7)
                .createdAt(LocalDateTime.of(2025, 3, 1, 12, 0))
                .build();
    }

    public static MangaRating minimumScores() {
        return MangaRating.builder()
                .id(RATING_6_ID)
                .titleId(TitleMock.TITLE_6_ID)
                .userId(UserMock.INACTIVE_ID.toString())
                .userName("Novo Usuario")
                .funRating(0.5)
                .artRating(0.5)
                .storylineRating(0.5)
                .charactersRating(0.5)
                .originalityRating(0.5)
                .pacingRating(0.5)
                .overallRating(0.5)
                .comment("Não é pra mim.")
                .createdAt(LocalDateTime.of(2025, 3, 5, 8, 0))
                .build();
    }

    public static MangaRating forTitle(String titleId, String userId, String userName) {
        return MangaRating.builder()
                .titleId(titleId)
                .userId(userId)
                .userName(userName)
                .funRating(4.0)
                .artRating(4.0)
                .storylineRating(4.0)
                .charactersRating(4.0)
                .originalityRating(4.0)
                .pacingRating(4.0)
                .overallRating(4.0)
                .comment("Boa leitura.")
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<MangaRating> allRatings() {
        return List.of(highRating(), averageRating(), lowRating(),
                perfectScore(), withoutComment(), minimumScores());
    }

    public static List<MangaRating> positiveRatings() {
        return List.of(highRating(), perfectScore());
    }

    public static List<MangaRating> byUser(String userId) {
        return allRatings().stream()
                .filter(r -> r.getUserId().equals(userId))
                .toList();
    }
}
