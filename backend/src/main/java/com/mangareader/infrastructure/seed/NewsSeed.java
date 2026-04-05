package com.mangareader.infrastructure.seed;

import java.util.List;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.infrastructure.persistence.mongo.repository.NewsMongoRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class NewsSeed implements EntitySeeder {
    private final NewsMongoRepository newsRepository;

    @Override
    public int getOrder() {
        return 7;
    }

    @Override
    public void seed() {
        if (newsRepository.count() > 0) {
            log.info("Notícias já existem — seed de news ignorado.");

            return;
        }

        var authorRedacao = NewsAuthor.builder()
                .id("author-1").name("Redação MangaReader")
                .avatar("https://i.pravatar.cc/100?img=50")
                .role("Editor").profileLink("/profile/redacao").build();

        var authorColunista = NewsAuthor.builder()
                .id("author-2").name("Yuki Sato")
                .avatar("https://i.pravatar.cc/100?img=23")
                .role("Colunista").profileLink("/profile/yuki-sato").build();

        var news = List.of(
                NewsItem.builder()
                        .id("news-1")
                        .title("Novo mangá de fantasia 'Reino de Aço' bate recordes de vendas")
                        .subtitle("A obra ultrapassou 500 mil cópias vendidas em apenas 3 meses")
                        .excerpt("O mangá de estreia de Takeshi Yamamoto se consolida como o grande sucesso do ano.")
                        .content(List.of(
                                "O mangá 'Reino de Aço' alcançou a marca de 500 mil cópias vendidas, confirmando-se como um dos maiores lançamentos do ano.",
                                "A obra, que narra a jornada de um ferreiro órfão em um mundo dominado por armaduras vivas, vem conquistando leitores com sua arte detalhada e história envolvente.",
                                "Segundo a editora Panini, uma adaptação para anime já está em negociação com estúdios japoneses."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=301")
                        .source("Panini Comics").sourceLogo("https://picsum.photos/50/50?random=401")
                        .category(NewsCategory.LANCAMENTOS)
                        .tags(List.of("Reino de Aço", "Vendas", "Mangá", "Panini"))
                        .author(authorRedacao)
                        .readTime(4).views(3200).commentsCount(45).trendingScore(95)
                        .isFeatured(true)
                        .reactions(NewsReaction.builder().like(180).excited(92).sad(3).surprised(24).build())
                        .build(),
                NewsItem.builder()
                        .id("news-2")
                        .title("Solo Leveling confirma 3ª temporada do anime para 2026")
                        .subtitle("A-1 Pictures retorna para animar o arco mais aguardado")
                        .excerpt("Fãs comemoram a confirmação da terceira temporada com trailer inédito.")
                        .content(List.of(
                                "A Crunchyroll confirmou oficialmente que a terceira temporada de Solo Leveling será produzida pela A-1 Pictures.",
                                "O novo arco adaptará os volumes 8 a 11 da light novel, incluindo o aguardado 'Arco da Ilha Jeju'.",
                                "A estreia está prevista para outubro de 2026."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=302")
                        .source("Crunchyroll").sourceLogo("https://picsum.photos/50/50?random=402")
                        .category(NewsCategory.ADAPTACOES)
                        .tags(List.of("Solo Leveling", "Anime", "A-1 Pictures"))
                        .author(authorColunista)
                        .readTime(3).views(8500).commentsCount(120).trendingScore(98)
                        .isExclusive(true).isFeatured(true)
                        .reactions(NewsReaction.builder().like(450).excited(320).sad(5).surprised(67).build())
                        .build(),
                NewsItem.builder()
                        .id("news-3")
                        .title("Guia: os melhores mangás de 2025 segundo os leitores")
                        .subtitle("Votação aberta elegeu os favoritos do público brasileiro")
                        .excerpt("Confira a lista completa com os 10 mangás mais votados.")
                        .content(List.of(
                                "A comunidade MangaReader elegeu os 10 melhores mangás de 2025 em votação aberta que reuniu mais de 50 mil participantes.",
                                "No topo da lista está 'Reino de Aço', seguido por 'Flores de Neon' e 'Crônicas de Polaris'.",
                                "A lista completa inclui obras de diversos gêneros, mostrando a diversidade do público leitor."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=303")
                        .source("MangaReader").sourceLogo("https://picsum.photos/50/50?random=403")
                        .category(NewsCategory.PRINCIPAIS)
                        .tags(List.of("Top 10", "2025", "Votação", "Comunidade"))
                        .author(authorRedacao)
                        .readTime(6).views(5400).commentsCount(78).trendingScore(88)
                        .reactions(NewsReaction.builder().like(210).excited(45).sad(12).surprised(8).build())
                        .build(),
                NewsItem.builder()
                        .id("news-4")
                        .title("Editora NewPOP anuncia 5 novos manhwas para o catálogo brasileiro")
                        .subtitle("Lançamentos incluem obras de ação, romance e fantasia")
                        .excerpt("A editora continua expandindo seu catálogo de webtoons coreanos traduzidos.")
                        .content(List.of(
                                "A NewPOP anunciou a adição de 5 novos manhwas ao seu catálogo, com lançamentos previstos para o segundo semestre de 2026.",
                                "Entre os títulos confirmados estão obras dos gêneros ação, romance e fantasia, com foco no público jovem adulto.",
                                "Os volumes físicos terão edição especial com capa variante no primeiro mês."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=304")
                        .source("NewPOP").sourceLogo("https://picsum.photos/50/50?random=404")
                        .category(NewsCategory.LANCAMENTOS)
                        .tags(List.of("NewPOP", "Manhwa", "Lançamento"))
                        .author(authorColunista)
                        .readTime(3).views(2100).commentsCount(34).trendingScore(72)
                        .reactions(NewsReaction.builder().like(98).excited(56).sad(2).surprised(15).build())
                        .build(),
                NewsItem.builder()
                        .id("news-5")
                        .title("Entrevista exclusiva: Hiroshi Tanaka fala sobre Crônicas de Polaris")
                        .subtitle("Autor revela inspirações e adianta novidades sobre o arco final")
                        .excerpt("Em entrevista ao MangaReader, o criador de Crônicas de Polaris compartilha os bastidores da obra.")
                        .content(List.of(
                                "Em uma entrevista exclusiva, Hiroshi Tanaka revelou que a inspiração para Crônicas de Polaris veio de viagens pela América do Sul.",
                                "O autor confirmou que a obra terá um arco final com 30 capítulos, previsto para começar no próximo trimestre.",
                                "Tanaka também mencionou interesse em colaborações com outros mangakás brasileiros para projetos futuros."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=305")
                        .source("MangaReader").sourceLogo("https://picsum.photos/50/50?random=405")
                        .category(NewsCategory.ENTREVISTAS)
                        .tags(List.of("Hiroshi Tanaka", "Crônicas de Polaris", "Entrevista"))
                        .author(authorRedacao)
                        .readTime(8).views(4300).commentsCount(56).trendingScore(82)
                        .isExclusive(true)
                        .reactions(NewsReaction.builder().like(156).excited(78).sad(8).surprised(42).build())
                        .build()
        );

        newsRepository.saveAll(news);

        log.info("✓ {} notícias de demonstração criadas.", news.size());
    }
}
