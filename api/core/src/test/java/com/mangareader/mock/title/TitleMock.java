package com.mangareader.mock.title;

import com.mangareader.domain.manga.entity.Title;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public final class TitleMock {
    private TitleMock() {}

    public static final String TITLE_1_ID = "title-1";
    public static final String TITLE_2_ID = "title-2";
    public static final String TITLE_3_ID = "title-3";
    public static final String TITLE_4_ID = "title-4";
    public static final String TITLE_5_ID = "title-5";
    public static final String TITLE_6_ID = "title-6";
    public static final String TITLE_7_ID = "title-7";
    public static final String TITLE_8_ID = "title-8";

    public static Title reinoDeAco() {
        return Title.builder()
                .id(TITLE_1_ID)
                .type("Manga")
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Reino de Aco"))
                .cover("https://picsum.photos/300/450?random=101")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Em um mundo onde armaduras vivas dominam os campos de batalha, "
                        + "um jovem ferreiro descobre que pode ouvir a voz do metal."))
                .genres(new ArrayList<>(List.of("Acao", "Fantasia", "Aventura")))
                .popularity("98")
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
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Lamina do Amanha"))
                .cover("https://picsum.photos/300/450?random=102")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Quando a tecnologia e a espada se encontram, uma guerreira do futuro "
                        + "volta ao passado para impedir uma catastrofe."))
                .genres(new ArrayList<>(List.of("Acao", "Sci-Fi", "Drama")))
                .popularity("85")
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
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Flores de Neon"))
                .cover("https://picsum.photos/300/450?random=103")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Numa metrópole futurista iluminada por neon, uma florista descobre "
                        + "que suas plantas possuem poderes sobrenaturais."))
                .genres(new ArrayList<>(List.of("Romance", "Fantasia", "Slice of Life")))
                .popularity("72")
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
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Cronicas de Polaris"))
                .cover("https://picsum.photos/300/450?random=104")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Exploradores cruzam um oceano desconhecido em busca de uma terra lendaria "
                        + "guiados pela estrela Polaris."))
                .genres(new ArrayList<>(List.of("Aventura", "Misterio", "Fantasia")))
                .popularity("91")
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
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Vento Cortante"))
                .cover("https://picsum.photos/300/450?random=105")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Um espadachim cego viaja pelo Japao feudal em busca de redencao."))
                .genres(new ArrayList<>(List.of("Acao", "Historico", "Drama")))
                .popularity("80")
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
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Guardiao Celestial"))
                .cover("https://picsum.photos/300/450?random=106")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Um anjo caido protege a humanidade enquanto busca recuperar suas asas."))
                .genres(new ArrayList<>(List.of("Acao", "Fantasia", "Sobrenatural")))
                .popularity("76")
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
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Coracao de Porcelana"))
                .cover("https://picsum.photos/300/450?random=107")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Uma artesã de porcelana descobre que suas criações ganham vida a noite."))
                .genres(new ArrayList<>(List.of("Romance", "Drama", "Sobrenatural")))
                .popularity("55")
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
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Protocolo Zero"))
                .cover("https://picsum.photos/300/450?random=108")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Numa sociedade controlada por IA, um hacker descobre uma falha no sistema "
                        + "que pode libertar a humanidade."))
                .genres(new ArrayList<>(List.of("Sci-Fi", "Thriller", "Acao")))
                .popularity("88")
                .author("Aoi Nakamura")
                .artist("Ren Fujimoto")
                .publisher("Shogakukan")
                .createdAt(LocalDateTime.of(2023, 11, 15, 0, 0))
                .build();
    }

    public static Title withNoChapters() {
        return Title.builder()
                .id("title-empty")
                .type("Manga")
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Titulo Sem Capitulos"))
                .cover("https://picsum.photos/300/450?random=200")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Um titulo recem-criado sem capitulos publicados."))
                .genres(new ArrayList<>(List.of("Slice of Life")))
                .popularity("0")
                .author("Autor Desconhecido")
                .build();
    }

    public static Title withNoRatings() {
        return Title.builder()
                .id("title-no-ratings")
                .type("Manhwa")
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Obra Nova Sem Avaliacoes"))
                .cover("https://picsum.photos/300/450?random=201")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Lancamento recente que ainda nao recebeu avaliacoes."))
                .genres(new ArrayList<>(List.of("Acao")))
                .popularity("10")
                .author("Novo Autor")
                .artist("Novo Artista")
                .createdAt(LocalDateTime.now())
                .build();
    }

    public static Title withAllGenres() {
        return Title.builder()
                .id("title-all-genres")
                .type("Manga")
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Obra Multi-genero"))
                .cover("https://picsum.photos/300/450?random=202")
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Uma obra experimental que mistura todos os generos."))
                .genres(new ArrayList<>(List.of(
                        "Acao", "Aventura", "Romance", "Fantasia", "Sci-Fi",
                        "Drama", "Comedia", "Horror", "Misterio", "Slice of Life",
                        "Historico", "Sobrenatural", "Esportes", "Thriller"
                )))
                .popularity("50")
                .author("Multi Autor")
                .build();
    }

    public static Title withId(String id) {
        return Title.builder()
                .id(id)
                .type("Manga")
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Title " + id))
                .synopsis(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Synopsis for " + id))
                .genres(new ArrayList<>(List.of("Acao")))
                .popularity("50")
                .author("Author " + id)
                .build();
    }

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
