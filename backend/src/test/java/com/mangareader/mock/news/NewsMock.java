package com.mangareader.mock.news;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsReaction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class NewsMock {

    private NewsMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final String NEWS_1_ID = "news-1";
    public static final String NEWS_2_ID = "news-2";
    public static final String NEWS_3_ID = "news-3";
    public static final String NEWS_4_ID = "news-4";
    public static final String NEWS_5_ID = "news-5";

    // ── Authors ────────────────────────────────────────────────────────────

    public static NewsAuthor editorAuthor() {
        return NewsAuthor.builder()
                .id("author-1")
                .name("Ana Beatriz")
                .avatar("https://i.pravatar.cc/100?img=21")
                .role("Editor-chefe")
                .profileLink("/users/00000000-0000-0000-0000-000000000002")
                .build();
    }

    public static NewsAuthor reporterAuthor() {
        return NewsAuthor.builder()
                .id("author-2")
                .name("Carlos Henrique")
                .avatar("https://i.pravatar.cc/100?img=15")
                .role("Reporter")
                .profileLink("/users/author-2")
                .build();
    }

    // ── Reactions ──────────────────────────────────────────────────────────

    public static NewsReaction popularReactions() {
        return NewsReaction.builder()
                .like(245)
                .excited(180)
                .sad(12)
                .surprised(95)
                .build();
    }

    public static NewsReaction lowReactions() {
        return NewsReaction.builder()
                .like(5)
                .excited(2)
                .sad(0)
                .surprised(1)
                .build();
    }

    public static NewsReaction zeroReactions() {
        return new NewsReaction();
    }

    // ── News items ─────────────────────────────────────────────────────────

    public static NewsItem featuredRelease() {
        return NewsItem.builder()
                .id(NEWS_1_ID)
                .title("Novo capitulo de Reino de Aco bate recorde de visualizacoes")
                .subtitle("Capitulo 8 teve mais de 50 mil leituras em 24 horas")
                .excerpt("O mais recente capitulo da saga surpreendeu fas com um plot twist inesperado.")
                .content(new ArrayList<>(List.of(
                        "O capitulo 8 de Reino de Aco, lancado na ultima segunda-feira, "
                                + "alcancou a marca de 50 mil leituras em apenas 24 horas.",
                        "O autor Takeshi Yamamoto revelou em entrevista que este arco "
                                + "estava planejado desde o inicio da serie.",
                        "Os fas reagiram com surpresa ao plot twist final, que muda "
                                + "completamente a direcao da historia."
                )))
                .coverImage("https://picsum.photos/800/400?random=n1")
                .gallery(new ArrayList<>(List.of(
                        "https://picsum.photos/800/400?random=n1a",
                        "https://picsum.photos/800/400?random=n1b"
                )))
                .source("Manga Reader")
                .sourceLogo("https://picsum.photos/50/50?random=logo")
                .category(NewsCategory.LANCAMENTOS)
                .tags(new ArrayList<>(List.of("Reino de Aco", "lancamento", "recorde")))
                .author(editorAuthor())
                .readTime(5)
                .views(12000)
                .commentsCount(87)
                .trendingScore(950)
                .isExclusive(false)
                .isFeatured(true)
                .reactions(popularReactions())
                .publishedAt(LocalDateTime.of(2025, 3, 10, 8, 0))
                .build();
    }

    public static NewsItem exclusiveInterview() {
        return NewsItem.builder()
                .id(NEWS_2_ID)
                .title("Entrevista exclusiva com Park Min-jun, criador de Lamina do Amanha")
                .subtitle("O artista fala sobre inspiracoes e planos futuros")
                .excerpt("Em entrevista ao Manga Reader, Park Min-jun revela detalhes sobre o proximo arco.")
                .content(new ArrayList<>(List.of(
                        "Park Min-jun nos recebeu em seu estudio em Seul para uma conversa exclusiva.",
                        "O manhwa Lamina do Amanha nasceu de um sonho recorrente que o autor tinha.",
                        "Sobre o futuro da serie, Park revelou que planeja mais 3 arcos."
                )))
                .coverImage("https://picsum.photos/800/400?random=n2")
                .gallery(new ArrayList<>())
                .source("Manga Reader")
                .sourceLogo("https://picsum.photos/50/50?random=logo")
                .category(NewsCategory.ENTREVISTAS)
                .tags(new ArrayList<>(List.of("Park Min-jun", "entrevista", "Lamina do Amanha")))
                .author(reporterAuthor())
                .readTime(12)
                .views(8500)
                .commentsCount(42)
                .trendingScore(720)
                .isExclusive(true)
                .isFeatured(false)
                .reactions(popularReactions())
                .publishedAt(LocalDateTime.of(2025, 3, 8, 14, 0))
                .build();
    }

    public static NewsItem industryAnalysis() {
        return NewsItem.builder()
                .id(NEWS_3_ID)
                .title("Mercado de manga no Brasil cresce 30% em 2025")
                .subtitle("Dados da ABDR mostram expansao historica")
                .excerpt("O setor de manga no Brasil vive seu melhor momento com crescimento recorde.")
                .content(new ArrayList<>(List.of(
                        "Segundo dados da Associacao Brasileira de Direitos Reprograficos, "
                                + "o mercado de manga cresceu 30% em relacao a 2024.",
                        "Os generos mais vendidos foram acao, romance e fantasia."
                )))
                .coverImage("https://picsum.photos/800/400?random=n3")
                .gallery(new ArrayList<>())
                .source("ABDR")
                .sourceLogo("https://picsum.photos/50/50?random=abdr")
                .category(NewsCategory.INDUSTRIA)
                .tags(new ArrayList<>(List.of("mercado", "Brasil", "crescimento")))
                .author(editorAuthor())
                .readTime(8)
                .views(3200)
                .commentsCount(15)
                .trendingScore(400)
                .isExclusive(false)
                .isFeatured(false)
                .reactions(lowReactions())
                .publishedAt(LocalDateTime.of(2025, 2, 20, 10, 0))
                .build();
    }

    public static NewsItem eventCoverage() {
        return NewsItem.builder()
                .id(NEWS_4_ID)
                .title("Cobertura completa do Manga Fest 2025")
                .subtitle("Tudo o que aconteceu no maior evento de manga do ano")
                .excerpt("Confira os destaques dos tres dias de evento.")
                .content(new ArrayList<>(List.of(
                        "O Manga Fest 2025 reuniu mais de 15 mil pessoas.",
                        "O concurso de cosplay teve 200 participantes.",
                        "Autores japoneses e coreanos participaram de paineis."
                )))
                .coverImage("https://picsum.photos/800/400?random=n4")
                .gallery(new ArrayList<>(List.of(
                        "https://picsum.photos/800/400?random=n4a",
                        "https://picsum.photos/800/400?random=n4b",
                        "https://picsum.photos/800/400?random=n4c",
                        "https://picsum.photos/800/400?random=n4d"
                )))
                .source("Manga Reader")
                .sourceLogo("https://picsum.photos/50/50?random=logo")
                .category(NewsCategory.EVENTOS)
                .tags(new ArrayList<>(List.of("Manga Fest", "evento", "cobertura")))
                .author(reporterAuthor())
                .readTime(15)
                .views(18000)
                .commentsCount(120)
                .trendingScore(850)
                .isExclusive(false)
                .isFeatured(true)
                .videoUrl("https://youtube.com/watch?v=mangafest2025")
                .reactions(popularReactions())
                .technicalSheet(new HashMap<>(Map.of(
                        "Local", "Centro de Convencoes SP",
                        "Data", "15-17 Nov 2025",
                        "Publico", "15.000 pessoas"
                )))
                .publishedAt(LocalDateTime.of(2025, 11, 18, 9, 0))
                .build();
    }

    public static NewsItem minimalNews() {
        return NewsItem.builder()
                .id(NEWS_5_ID)
                .title("Nota rapida: Manutencao programada")
                .excerpt("O site ficara fora do ar por 2 horas.")
                .content(new ArrayList<>(List.of("Manutencao programada para as 3h da manha.")))
                .coverImage("https://picsum.photos/800/400?random=n5")
                .category(NewsCategory.PRINCIPAIS)
                .tags(new ArrayList<>())
                .author(editorAuthor())
                .reactions(zeroReactions())
                .publishedAt(LocalDateTime.of(2025, 3, 12, 20, 0))
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<NewsItem> allNews() {
        return List.of(featuredRelease(), exclusiveInterview(), industryAnalysis(),
                eventCoverage(), minimalNews());
    }

    public static List<NewsItem> featured() {
        return List.of(featuredRelease(), eventCoverage());
    }

    public static List<NewsItem> byCategory(NewsCategory category) {
        return allNews().stream()
                .filter(n -> n.getCategory() == category)
                .toList();
    }
}
