package com.mangareader.mock.title;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.manga.valueobject.Chapter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public final class TitleMock {

    private TitleMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final String TITLE_1_ID = "title-1";
    public static final String TITLE_2_ID = "title-2";
    public static final String TITLE_3_ID = "title-3";
    public static final String TITLE_4_ID = "title-4";
    public static final String TITLE_5_ID = "title-5";
    public static final String TITLE_6_ID = "title-6";
    public static final String TITLE_7_ID = "title-7";
    public static final String TITLE_8_ID = "title-8";

    // ── Chapters ───────────────────────────────────────────────────────────

    public static Chapter chapter(String number, String chapterTitle) {
        return Chapter.builder()
                .number(number)
                .title(chapterTitle)
                .releaseDate("2025-06-10")
                .pages("42")
                .build();
    }

    public static List<Chapter> chaptersRange(int from, int to) {
        List<Chapter> chapters = new ArrayList<>();
        for (int i = from; i <= to; i++) {
            chapters.add(Chapter.builder()
                    .number(String.valueOf(i))
                    .title("Capitulo " + i)
                    .releaseDate("2025-06-" + String.format("%02d", Math.min(i, 28)))
                    .pages(String.valueOf(30 + i))
                    .build());
        }
        return chapters;
    }

    // ── Manga ──────────────────────────────────────────────────────────────

    public static Title reinoDeAco() {
        return Title.builder()
                .id(TITLE_1_ID)
                .type("Manga")
                .name("Reino de Aco")
                .cover("https://picsum.photos/300/450?random=101")
                .synopsis("Em um mundo onde armaduras vivas dominam os campos de batalha, "
                        + "um jovem ferreiro descobre que pode ouvir a voz do metal.")
                .genres(new ArrayList<>(List.of("Acao", "Fantasia", "Aventura")))
                .chapters(new ArrayList<>(chaptersRange(1, 8)))
                .popularity("98")
                .ratingAverage(4.5)
                .ratingCount(120L)
                .rankingScore(92.0)
                .author("Takeshi Yamamoto")
                .artist("Takeshi Yamamoto")
                .publisher("Panini")
                .createdAt(LocalDateTime.of(2024, 1, 15, 0, 0))
                .build();
    }

    public static Title laminaDoAmanha() {
        return Title.builder()
                .id(TITLE_2_ID)
                .type("Manhwa")
                .name("Lamina do Amanha")
                .cover("https://picsum.photos/300/450?random=102")
                .synopsis("Quando a tecnologia e a espada se encontram, uma guerreira do futuro "
                        + "volta ao passado para impedir uma catastrofe.")
                .genres(new ArrayList<>(List.of("Acao", "Sci-Fi", "Drama")))
                .chapters(new ArrayList<>(chaptersRange(1, 12)))
                .popularity("85")
                .ratingAverage(4.2)
                .ratingCount(95L)
                .rankingScore(88.0)
                .author("Park Min-jun")
                .artist("Park Min-jun")
                .publisher("Webtoon")
                .createdAt(LocalDateTime.of(2024, 2, 1, 0, 0))
                .build();
    }

    public static Title floresDeNeon() {
        return Title.builder()
                .id(TITLE_3_ID)
                .type("Manhua")
                .name("Flores de Neon")
                .cover("https://picsum.photos/300/450?random=103")
                .synopsis("Numa metrópole futurista iluminada por neon, uma florista descobre "
                        + "que suas plantas possuem poderes sobrenaturais.")
                .genres(new ArrayList<>(List.of("Romance", "Fantasia", "Slice of Life")))
                .chapters(new ArrayList<>(chaptersRange(1, 6)))
                .popularity("72")
                .ratingAverage(3.8)
                .ratingCount(60L)
                .rankingScore(75.0)
                .author("Liu Mei")
                .artist("Liu Mei")
                .publisher("Bilibili Comics")
                .createdAt(LocalDateTime.of(2024, 3, 10, 0, 0))
                .build();
    }

    public static Title cronicasDePolaris() {
        return Title.builder()
                .id(TITLE_4_ID)
                .type("Manga")
                .name("Cronicas de Polaris")
                .cover("https://picsum.photos/300/450?random=104")
                .synopsis("Exploradores cruzam um oceano desconhecido em busca de uma terra lendaria "
                        + "guiados pela estrela Polaris.")
                .genres(new ArrayList<>(List.of("Aventura", "Misterio", "Fantasia")))
                .chapters(new ArrayList<>(chaptersRange(1, 20)))
                .popularity("91")
                .ratingAverage(4.7)
                .ratingCount(200L)
                .rankingScore(95.0)
                .author("Hiroshi Tanaka")
                .artist("Yuki Sato")
                .publisher("Shueisha")
                .createdAt(LocalDateTime.of(2023, 6, 1, 0, 0))
                .build();
    }

    public static Title ventoCortante() {
        return Title.builder()
                .id(TITLE_5_ID)
                .type("Manga")
                .name("Vento Cortante")
                .cover("https://picsum.photos/300/450?random=105")
                .synopsis("Um espadachim cego viaja pelo Japao feudal em busca de redencao.")
                .genres(new ArrayList<>(List.of("Acao", "Historico", "Drama")))
                .chapters(new ArrayList<>(chaptersRange(1, 15)))
                .popularity("80")
                .ratingAverage(4.0)
                .ratingCount(85L)
                .rankingScore(82.0)
                .author("Kenji Mori")
                .artist("Kenji Mori")
                .publisher("Kodansha")
                .createdAt(LocalDateTime.of(2024, 4, 20, 0, 0))
                .build();
    }

    public static Title guardiaoCelestial() {
        return Title.builder()
                .id(TITLE_6_ID)
                .type("Manhwa")
                .name("Guardiao Celestial")
                .cover("https://picsum.photos/300/450?random=106")
                .synopsis("Um anjo caido protege a humanidade enquanto busca recuperar suas asas.")
                .genres(new ArrayList<>(List.of("Acao", "Fantasia", "Sobrenatural")))
                .chapters(new ArrayList<>(chaptersRange(1, 10)))
                .popularity("76")
                .ratingAverage(3.5)
                .ratingCount(45L)
                .rankingScore(70.0)
                .author("Kim Soo-yeon")
                .artist("Kim Soo-yeon")
                .publisher("Kakao")
                .createdAt(LocalDateTime.of(2024, 5, 5, 0, 0))
                .build();
    }

    public static Title coracaoDePorcelana() {
        return Title.builder()
                .id(TITLE_7_ID)
                .type("Manhua")
                .name("Coracao de Porcelana")
                .cover("https://picsum.photos/300/450?random=107")
                .synopsis("Uma artesã de porcelana descobre que suas criações ganham vida a noite.")
                .genres(new ArrayList<>(List.of("Romance", "Drama", "Sobrenatural")))
                .chapters(new ArrayList<>(chaptersRange(1, 4)))
                .popularity("55")
                .ratingAverage(3.2)
                .ratingCount(30L)
                .rankingScore(58.0)
                .author("Chen Wei")
                .artist("Chen Wei")
                .publisher("Kuaikan")
                .createdAt(LocalDateTime.of(2024, 7, 1, 0, 0))
                .build();
    }

    public static Title protocoloZero() {
        return Title.builder()
                .id(TITLE_8_ID)
                .type("Manga")
                .name("Protocolo Zero")
                .cover("https://picsum.photos/300/450?random=108")
                .synopsis("Numa sociedade controlada por IA, um hacker descobre uma falha no sistema "
                        + "que pode libertar a humanidade.")
                .genres(new ArrayList<>(List.of("Sci-Fi", "Thriller", "Acao")))
                .chapters(new ArrayList<>(chaptersRange(1, 18)))
                .popularity("88")
                .ratingAverage(4.3)
                .ratingCount(150L)
                .rankingScore(90.0)
                .author("Aoi Nakamura")
                .artist("Ren Fujimoto")
                .publisher("Shogakukan")
                .createdAt(LocalDateTime.of(2023, 11, 15, 0, 0))
                .build();
    }

    // ── Edge cases ─────────────────────────────────────────────────────────

    public static Title withNoChapters() {
        return Title.builder()
                .id("title-empty")
                .type("Manga")
                .name("Titulo Sem Capitulos")
                .cover("https://picsum.photos/300/450?random=200")
                .synopsis("Um titulo recem-criado sem capitulos publicados.")
                .genres(new ArrayList<>(List.of("Slice of Life")))
                .chapters(new ArrayList<>())
                .popularity("0")
                .ratingAverage(0.0)
                .ratingCount(0L)
                .rankingScore(0.0)
                .author("Autor Desconhecido")
                .build();
    }

    public static Title withNoRatings() {
        return Title.builder()
                .id("title-no-ratings")
                .type("Manhwa")
                .name("Obra Nova Sem Avaliacoes")
                .cover("https://picsum.photos/300/450?random=201")
                .synopsis("Lancamento recente que ainda nao recebeu avaliacoes.")
                .genres(new ArrayList<>(List.of("Acao")))
                .chapters(new ArrayList<>(chaptersRange(1, 3)))
                .popularity("10")
                .ratingAverage(0.0)
                .ratingCount(0L)
                .rankingScore(5.0)
                .author("Novo Autor")
                .artist("Novo Artista")
                .createdAt(LocalDateTime.now())
                .build();
    }

    public static Title withAllGenres() {
        return Title.builder()
                .id("title-all-genres")
                .type("Manga")
                .name("Obra Multi-genero")
                .cover("https://picsum.photos/300/450?random=202")
                .synopsis("Uma obra experimental que mistura todos os generos.")
                .genres(new ArrayList<>(List.of(
                        "Acao", "Aventura", "Romance", "Fantasia", "Sci-Fi",
                        "Drama", "Comedia", "Horror", "Misterio", "Slice of Life",
                        "Historico", "Sobrenatural", "Esportes", "Thriller"
                )))
                .chapters(new ArrayList<>(chaptersRange(1, 2)))
                .popularity("50")
                .author("Multi Autor")
                .build();
    }

    public static Title withId(String id) {
        return Title.builder()
                .id(id)
                .type("Manga")
                .name("Title " + id)
                .synopsis("Synopsis for " + id)
                .genres(new ArrayList<>(List.of("Acao")))
                .chapters(new ArrayList<>())
                .popularity("50")
                .author("Author " + id)
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<Title> catalog() {
        return List.of(
                reinoDeAco(), laminaDoAmanha(), floresDeNeon(), cronicasDePolaris(),
                ventoCortante(), guardiaoCelestial(), coracaoDePorcelana(), protocoloZero()
        );
    }

    public static List<Title> mangasOnly() {
        return List.of(reinoDeAco(), cronicasDePolaris(), ventoCortante(), protocoloZero());
    }

    public static List<Title> manhwasOnly() {
        return List.of(laminaDoAmanha(), guardiaoCelestial());
    }

    public static List<Title> manhuasOnly() {
        return List.of(floresDeNeon(), coracaoDePorcelana());
    }

    public static List<Title> topRated() {
        return List.of(cronicasDePolaris(), reinoDeAco(), protocoloZero());
    }
}
