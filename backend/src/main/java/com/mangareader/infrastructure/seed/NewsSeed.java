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

        var authorFreelancer = NewsAuthor.builder()
                .id("author-3").name("Lucas Andrade")
                .avatar("https://i.pravatar.cc/100?img=30")
                .role("Freelancer").profileLink("/profile/lucas-andrade").build();

        var moreNews = List.of(
                NewsItem.builder()
                        .id("news-6")
                        .title("Shueisha registra crescimento de 30% em receita digital")
                        .subtitle("Manga Plus e Jump+ impulsionam números globais")
                        .excerpt("A editora japonesa consolida sua estratégia digital com números recordes.")
                        .content(List.of(
                                "A Shueisha reportou crescimento de 30% na receita de suas plataformas digitais de mangá.",
                                "O Manga Plus ultrapassou 70 milhões de usuários ativos mensais.",
                                "A empresa planeja expandir traduções simultâneas para mais idiomas."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=306")
                        .source("Shueisha").sourceLogo("https://picsum.photos/50/50?random=406")
                        .category(NewsCategory.INDUSTRIA)
                        .tags(List.of("Shueisha", "Digital", "Mercado"))
                        .author(authorRedacao)
                        .readTime(5).views(1800).commentsCount(22).trendingScore(65)
                        .reactions(NewsReaction.builder().like(88).excited(34).sad(0).surprised(12).build())
                        .build(),
                NewsItem.builder()
                        .id("news-7")
                        .title("AnimeCon SP 2026: tudo que sabemos até agora")
                        .subtitle("Convidados confirmados, ingressos e programação")
                        .excerpt("O maior evento otaku do Brasil revela detalhes da edição de 2026.")
                        .content(List.of(
                                "A AnimeCon SP 2026 acontecerá no São Paulo Expo com duração de 3 dias.",
                                "Convidados internacionais incluem mangakás e dubladores japoneses.",
                                "Ingressos VIP já estão esgotados; lote regular disponível."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=307")
                        .source("AnimeCon").sourceLogo("https://picsum.photos/50/50?random=407")
                        .category(NewsCategory.EVENTOS)
                        .tags(List.of("AnimeCon", "Evento", "São Paulo"))
                        .author(authorColunista)
                        .readTime(4).views(6200).commentsCount(89).trendingScore(91)
                        .isFeatured(true)
                        .reactions(NewsReaction.builder().like(320).excited(210).sad(2).surprised(18).build())
                        .build(),
                NewsItem.builder()
                        .id("news-8")
                        .title("10 curiosidades sobre a criação de mangás que você não sabia")
                        .subtitle("Do papel ao digital: segredos dos bastidores")
                        .content(List.of(
                                "Mangakás profissionais trabalham em média 16 horas por dia durante prazos apertados.",
                                "O processo de screentone ainda é feito manualmente por muitos artistas.",
                                "Editores de mangá frequentemente sugerem mudanças drásticas na história."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=308")
                        .source("MangaReader")
                        .category(NewsCategory.CURIOSIDADES)
                        .tags(List.of("Curiosidades", "Bastidores", "Mangá"))
                        .author(authorFreelancer)
                        .readTime(7).views(0).commentsCount(0).trendingScore(10)
                        .reactions(NewsReaction.builder().like(0).excited(0).sad(0).surprised(0).build())
                        .build(),
                NewsItem.builder()
                        .id("news-9")
                        .title("Mercado brasileiro de mangás cresce 45% e se torna o 3º maior do mundo")
                        .subtitle("Dados de 2025 confirmam o Brasil como potência no consumo de mangá")
                        .excerpt("O país ultrapassou a França em volume de vendas de mangás traduzidos.")
                        .content(List.of(
                                "O Brasil vendeu mais de 15 milhões de volumes de mangá em 2025.",
                                "As editoras Panini, JBC e NewPOP lideram o mercado nacional.",
                                "O crescimento é impulsionado por adaptações de anime em plataformas de streaming."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=309")
                        .source("PublishNews").sourceLogo("https://picsum.photos/50/50?random=409")
                        .category(NewsCategory.MERCADO)
                        .tags(List.of("Mercado", "Brasil", "Vendas"))
                        .author(authorRedacao)
                        .readTime(5).views(1_000_000).commentsCount(230).trendingScore(99)
                        .isExclusive(true).isFeatured(true)
                        .reactions(NewsReaction.builder().like(890).excited(560).sad(0).surprised(120).build())
                        .build(),
                NewsItem.builder()
                        .id("news-10")
                        .title("Japão aprova nova lei de proteção a direitos autorais de mangás digitais")
                        .subtitle("Lei visa combater pirataria e proteger artistas independentes")
                        .excerpt("A legislação entra em vigor em 2027 e afeta plataformas globais.")
                        .content(List.of(
                                "O parlamento japonês aprovou uma lei que fortalece a proteção de direitos autorais no meio digital.",
                                "Plataformas de leitura ilegais serão obrigadas a remover conteúdo em até 24 horas.",
                                "Artistas independentes terão acesso a um fundo de compensação por pirataria."
                        ))
                        .coverImage("https://picsum.photos/800/450?random=310")
                        .source("NHK World").sourceLogo("https://picsum.photos/50/50?random=410")
                        .category(NewsCategory.INTERNACIONAL)
                        .tags(List.of("Japão", "Legislação", "Pirataria", "Internacional"))
                        .author(authorColunista)
                        .readTime(6).views(3400).commentsCount(67).trendingScore(78)
                        .reactions(NewsReaction.builder().like(145).excited(30).sad(15).surprised(88).build())
                        .build()
        );

        var allNews = new java.util.ArrayList<>(news);
        allNews.addAll(moreNews);
        newsRepository.saveAll(allNews);

        log.info("✓ {} notícias de demonstração criadas.", allNews.size());
    }
}
