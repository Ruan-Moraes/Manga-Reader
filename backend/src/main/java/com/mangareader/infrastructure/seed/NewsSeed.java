package com.mangareader.infrastructure.seed;

import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsReaction;
import com.mangareader.infrastructure.persistence.mongo.repository.NewsMongoRepository;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.domain.i18n.LocalizedStringList;

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

    private static LocalizedString ls(String pt, String en, String es) {
        return LocalizedString.of(Map.of("pt-BR", pt, "en-US", en, "es-ES", es));
    }

    private static LocalizedStringList lsl(List<String> pt, List<String> en, List<String> es) {
        return LocalizedStringList.of(Map.of("pt-BR", pt, "en-US", en, "es-ES", es));
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
                        .title(ls(
                                "Novo mangá de fantasia 'Reino de Aço' bate recordes de vendas",
                                "New fantasy manga 'Kingdom of Steel' breaks sales records",
                                "El nuevo manga de fantasía 'Reino de Acero' rompe récords de ventas"))
                        .subtitle(ls(
                                "A obra ultrapassou 500 mil cópias vendidas em apenas 3 meses",
                                "The work surpassed 500 thousand copies sold in just 3 months",
                                "La obra superó las 500 mil copias vendidas en solo 3 meses"))
                        .excerpt(ls(
                                "O mangá de estreia de Takeshi Yamamoto se consolida como o grande sucesso do ano.",
                                "Takeshi Yamamoto's debut manga establishes itself as the year's biggest hit.",
                                "El manga debut de Takeshi Yamamoto se consolida como el gran éxito del año."))
                        .content(lsl(
                                List.of(
                                        "O mangá 'Reino de Aço' alcançou a marca de 500 mil cópias vendidas, confirmando-se como um dos maiores lançamentos do ano.",
                                        "A obra, que narra a jornada de um ferreiro órfão em um mundo dominado por armaduras vivas, vem conquistando leitores com sua arte detalhada e história envolvente.",
                                        "Segundo a editora Panini, uma adaptação para anime já está em negociação com estúdios japoneses."),
                                List.of(
                                        "The manga 'Kingdom of Steel' reached 500 thousand copies sold, confirming itself as one of the biggest releases of the year.",
                                        "The work, which follows an orphan blacksmith's journey through a world dominated by living armors, has captivated readers with its detailed art and engaging story.",
                                        "According to publisher Panini, an anime adaptation is already in negotiation with Japanese studios."),
                                List.of(
                                        "El manga 'Reino de Acero' alcanzó la marca de 500 mil copias vendidas, confirmándose como uno de los mayores lanzamientos del año.",
                                        "La obra, que narra el viaje de un herrero huérfano en un mundo dominado por armaduras vivientes, conquista lectores con su arte detallado e historia envolvente.",
                                        "Según la editorial Panini, una adaptación al anime ya está en negociación con estudios japoneses.")))
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
                        .title(ls(
                                "Solo Leveling confirma 3ª temporada do anime para 2026",
                                "Solo Leveling confirms anime season 3 for 2026",
                                "Solo Leveling confirma la 3ª temporada del anime para 2026"))
                        .subtitle(ls(
                                "A-1 Pictures retorna para animar o arco mais aguardado",
                                "A-1 Pictures returns to animate the most anticipated arc",
                                "A-1 Pictures regresa para animar el arco más esperado"))
                        .excerpt(ls(
                                "Fãs comemoram a confirmação da terceira temporada com trailer inédito.",
                                "Fans celebrate the third season confirmation with a brand new trailer.",
                                "Los fans celebran la confirmación de la tercera temporada con un tráiler inédito."))
                        .content(lsl(
                                List.of(
                                        "A Crunchyroll confirmou oficialmente que a terceira temporada de Solo Leveling será produzida pela A-1 Pictures.",
                                        "O novo arco adaptará os volumes 8 a 11 da light novel, incluindo o aguardado 'Arco da Ilha Jeju'.",
                                        "A estreia está prevista para outubro de 2026."),
                                List.of(
                                        "Crunchyroll officially confirmed that Solo Leveling's third season will be produced by A-1 Pictures.",
                                        "The new arc will adapt volumes 8 to 11 of the light novel, including the anticipated 'Jeju Island Arc'.",
                                        "The premiere is scheduled for October 2026."),
                                List.of(
                                        "Crunchyroll confirmó oficialmente que la tercera temporada de Solo Leveling será producida por A-1 Pictures.",
                                        "El nuevo arco adaptará los volúmenes 8 al 11 de la light novel, incluyendo el esperado 'Arco de la Isla Jeju'.",
                                        "El estreno está previsto para octubre de 2026.")))
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
                        .title(ls(
                                "Guia: os melhores mangás de 2025 segundo os leitores",
                                "Guide: the best manga of 2025 according to readers",
                                "Guía: los mejores mangas de 2025 según los lectores"))
                        .subtitle(ls(
                                "Votação aberta elegeu os favoritos do público brasileiro",
                                "Open vote elected the favorites of the Brazilian audience",
                                "Votación abierta eligió los favoritos del público brasileño"))
                        .excerpt(ls(
                                "Confira a lista completa com os 10 mangás mais votados.",
                                "Check the full list with the 10 most voted manga.",
                                "Consulta la lista completa con los 10 mangas más votados."))
                        .content(lsl(
                                List.of(
                                        "A comunidade MangaReader elegeu os 10 melhores mangás de 2025 em votação aberta que reuniu mais de 50 mil participantes.",
                                        "No topo da lista está 'Reino de Aço', seguido por 'Flores de Neon' e 'Crônicas de Polaris'.",
                                        "A lista completa inclui obras de diversos gêneros, mostrando a diversidade do público leitor."),
                                List.of(
                                        "The MangaReader community elected the 10 best manga of 2025 in an open vote that gathered over 50 thousand participants.",
                                        "At the top of the list is 'Kingdom of Steel', followed by 'Neon Flowers' and 'Polaris Chronicles'.",
                                        "The full list includes works from various genres, showing the diversity of the reading audience."),
                                List.of(
                                        "La comunidad MangaReader eligió los 10 mejores mangas de 2025 en una votación abierta que reunió a más de 50 mil participantes.",
                                        "En la cima de la lista está 'Reino de Acero', seguido por 'Flores de Neón' y 'Crónicas de Polaris'.",
                                        "La lista completa incluye obras de diversos géneros, mostrando la diversidad del público lector.")))
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
                        .title(ls(
                                "Editora NewPOP anuncia 5 novos manhwas para o catálogo brasileiro",
                                "Publisher NewPOP announces 5 new manhwa for the Brazilian catalog",
                                "La editorial NewPOP anuncia 5 nuevos manhwas para el catálogo brasileño"))
                        .subtitle(ls(
                                "Lançamentos incluem obras de ação, romance e fantasia",
                                "Releases include action, romance and fantasy works",
                                "Los lanzamientos incluyen obras de acción, romance y fantasía"))
                        .excerpt(ls(
                                "A editora continua expandindo seu catálogo de webtoons coreanos traduzidos.",
                                "The publisher continues expanding its catalog of translated Korean webtoons.",
                                "La editorial sigue expandiendo su catálogo de webtoons coreanos traducidos."))
                        .content(lsl(
                                List.of(
                                        "A NewPOP anunciou a adição de 5 novos manhwas ao seu catálogo, com lançamentos previstos para o segundo semestre de 2026.",
                                        "Entre os títulos confirmados estão obras dos gêneros ação, romance e fantasia, com foco no público jovem adulto.",
                                        "Os volumes físicos terão edição especial com capa variante no primeiro mês."),
                                List.of(
                                        "NewPOP announced the addition of 5 new manhwa to its catalog, with releases scheduled for the second half of 2026.",
                                        "Among the confirmed titles are action, romance and fantasy works, targeting the young adult audience.",
                                        "Physical volumes will feature a special edition with variant cover in the first month."),
                                List.of(
                                        "NewPOP anunció la adición de 5 nuevos manhwas a su catálogo, con lanzamientos previstos para el segundo semestre de 2026.",
                                        "Entre los títulos confirmados hay obras de acción, romance y fantasía, dirigidas al público joven adulto.",
                                        "Los volúmenes físicos tendrán edición especial con portada variante el primer mes.")))
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
                        .title(ls(
                                "Entrevista exclusiva: Hiroshi Tanaka fala sobre Crônicas de Polaris",
                                "Exclusive interview: Hiroshi Tanaka talks about Polaris Chronicles",
                                "Entrevista exclusiva: Hiroshi Tanaka habla sobre Crónicas de Polaris"))
                        .subtitle(ls(
                                "Autor revela inspirações e adianta novidades sobre o arco final",
                                "Author reveals inspirations and previews news about the final arc",
                                "El autor revela inspiraciones y adelanta novedades sobre el arco final"))
                        .excerpt(ls(
                                "Em entrevista ao MangaReader, o criador de Crônicas de Polaris compartilha os bastidores da obra.",
                                "In an interview with MangaReader, the creator of Polaris Chronicles shares the work's behind-the-scenes.",
                                "En entrevista con MangaReader, el creador de Crónicas de Polaris comparte los entresijos de la obra."))
                        .content(lsl(
                                List.of(
                                        "Em uma entrevista exclusiva, Hiroshi Tanaka revelou que a inspiração para Crônicas de Polaris veio de viagens pela América do Sul.",
                                        "O autor confirmou que a obra terá um arco final com 30 capítulos, previsto para começar no próximo trimestre.",
                                        "Tanaka também mencionou interesse em colaborações com outros mangakás brasileiros para projetos futuros."),
                                List.of(
                                        "In an exclusive interview, Hiroshi Tanaka revealed that the inspiration for Polaris Chronicles came from trips through South America.",
                                        "The author confirmed that the work will have a 30-chapter final arc, set to begin next quarter.",
                                        "Tanaka also mentioned interest in collaborations with other Brazilian mangaka for future projects."),
                                List.of(
                                        "En una entrevista exclusiva, Hiroshi Tanaka reveló que la inspiración para Crónicas de Polaris vino de viajes por Sudamérica.",
                                        "El autor confirmó que la obra tendrá un arco final con 30 capítulos, previsto para comenzar el próximo trimestre.",
                                        "Tanaka también mencionó interés en colaboraciones con otros mangakas brasileños para futuros proyectos.")))
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
                        .title(ls(
                                "Shueisha registra crescimento de 30% em receita digital",
                                "Shueisha posts 30% growth in digital revenue",
                                "Shueisha registra crecimiento del 30% en ingresos digitales"))
                        .subtitle(ls(
                                "Manga Plus e Jump+ impulsionam números globais",
                                "Manga Plus and Jump+ drive global numbers",
                                "Manga Plus y Jump+ impulsan las cifras globales"))
                        .excerpt(ls(
                                "A editora japonesa consolida sua estratégia digital com números recordes.",
                                "The Japanese publisher consolidates its digital strategy with record numbers.",
                                "La editorial japonesa consolida su estrategia digital con cifras récord."))
                        .content(lsl(
                                List.of(
                                        "A Shueisha reportou crescimento de 30% na receita de suas plataformas digitais de mangá.",
                                        "O Manga Plus ultrapassou 70 milhões de usuários ativos mensais.",
                                        "A empresa planeja expandir traduções simultâneas para mais idiomas."),
                                List.of(
                                        "Shueisha reported 30% growth in revenue from its digital manga platforms.",
                                        "Manga Plus surpassed 70 million monthly active users.",
                                        "The company plans to expand simultaneous translations to more languages."),
                                List.of(
                                        "Shueisha reportó un crecimiento del 30% en los ingresos de sus plataformas digitales de manga.",
                                        "Manga Plus superó los 70 millones de usuarios activos mensuales.",
                                        "La empresa planea expandir traducciones simultáneas a más idiomas.")))
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
                        .title(ls(
                                "AnimeCon SP 2026: tudo que sabemos até agora",
                                "AnimeCon SP 2026: everything we know so far",
                                "AnimeCon SP 2026: todo lo que sabemos hasta ahora"))
                        .subtitle(ls(
                                "Convidados confirmados, ingressos e programação",
                                "Confirmed guests, tickets and schedule",
                                "Invitados confirmados, entradas y programación"))
                        .excerpt(ls(
                                "O maior evento otaku do Brasil revela detalhes da edição de 2026.",
                                "Brazil's largest otaku event reveals details for the 2026 edition.",
                                "El mayor evento otaku de Brasil revela detalles de la edición de 2026."))
                        .content(lsl(
                                List.of(
                                        "A AnimeCon SP 2026 acontecerá no São Paulo Expo com duração de 3 dias.",
                                        "Convidados internacionais incluem mangakás e dubladores japoneses.",
                                        "Ingressos VIP já estão esgotados; lote regular disponível."),
                                List.of(
                                        "AnimeCon SP 2026 will take place at São Paulo Expo over 3 days.",
                                        "International guests include Japanese mangaka and voice actors.",
                                        "VIP tickets are already sold out; regular batch available."),
                                List.of(
                                        "AnimeCon SP 2026 se realizará en São Paulo Expo durante 3 días.",
                                        "Los invitados internacionales incluyen mangakas y dobladores japoneses.",
                                        "Las entradas VIP ya están agotadas; lote regular disponible.")))
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
                        .title(ls(
                                "10 curiosidades sobre a criação de mangás que você não sabia",
                                "10 trivia facts about manga creation you didn't know",
                                "10 curiosidades sobre la creación de mangas que no sabías"))
                        .subtitle(ls(
                                "Do papel ao digital: segredos dos bastidores",
                                "From paper to digital: behind-the-scenes secrets",
                                "Del papel a lo digital: secretos detrás de escena"))
                        .content(lsl(
                                List.of(
                                        "Mangakás profissionais trabalham em média 16 horas por dia durante prazos apertados.",
                                        "O processo de screentone ainda é feito manualmente por muitos artistas.",
                                        "Editores de mangá frequentemente sugerem mudanças drásticas na história."),
                                List.of(
                                        "Professional mangaka work an average of 16 hours a day during tight deadlines.",
                                        "The screentone process is still done manually by many artists.",
                                        "Manga editors often suggest drastic changes to the story."),
                                List.of(
                                        "Los mangakas profesionales trabajan en promedio 16 horas al día durante plazos ajustados.",
                                        "El proceso de screentone aún se hace manualmente por muchos artistas.",
                                        "Los editores de manga frecuentemente sugieren cambios drásticos en la historia.")))
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
                        .title(ls(
                                "Mercado brasileiro de mangás cresce 45% e se torna o 3º maior do mundo",
                                "Brazilian manga market grows 45% and becomes the 3rd largest in the world",
                                "El mercado brasileño de mangas crece 45% y se vuelve el 3º mayor del mundo"))
                        .subtitle(ls(
                                "Dados de 2025 confirmam o Brasil como potência no consumo de mangá",
                                "2025 data confirms Brazil as a powerhouse in manga consumption",
                                "Los datos de 2025 confirman a Brasil como potencia en el consumo de manga"))
                        .excerpt(ls(
                                "O país ultrapassou a França em volume de vendas de mangás traduzidos.",
                                "The country has surpassed France in sales volume of translated manga.",
                                "El país superó a Francia en volumen de ventas de mangas traducidos."))
                        .content(lsl(
                                List.of(
                                        "O Brasil vendeu mais de 15 milhões de volumes de mangá em 2025.",
                                        "As editoras Panini, JBC e NewPOP lideram o mercado nacional.",
                                        "O crescimento é impulsionado por adaptações de anime em plataformas de streaming."),
                                List.of(
                                        "Brazil sold over 15 million manga volumes in 2025.",
                                        "Publishers Panini, JBC and NewPOP lead the national market.",
                                        "Growth is driven by anime adaptations on streaming platforms."),
                                List.of(
                                        "Brasil vendió más de 15 millones de volúmenes de manga en 2025.",
                                        "Las editoriales Panini, JBC y NewPOP lideran el mercado nacional.",
                                        "El crecimiento está impulsado por adaptaciones de anime en plataformas de streaming.")))
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
                        .title(ls(
                                "Japão aprova nova lei de proteção a direitos autorais de mangás digitais",
                                "Japan approves new copyright protection law for digital manga",
                                "Japón aprueba nueva ley de protección de derechos de autor para mangas digitales"))
                        .subtitle(ls(
                                "Lei visa combater pirataria e proteger artistas independentes",
                                "Law aims to fight piracy and protect independent artists",
                                "La ley busca combatir la piratería y proteger a artistas independientes"))
                        .excerpt(ls(
                                "A legislação entra em vigor em 2027 e afeta plataformas globais.",
                                "The legislation takes effect in 2027 and affects global platforms.",
                                "La legislación entra en vigor en 2027 y afecta a plataformas globales."))
                        .content(lsl(
                                List.of(
                                        "O parlamento japonês aprovou uma lei que fortalece a proteção de direitos autorais no meio digital.",
                                        "Plataformas de leitura ilegais serão obrigadas a remover conteúdo em até 24 horas.",
                                        "Artistas independentes terão acesso a um fundo de compensação por pirataria."),
                                List.of(
                                        "The Japanese parliament approved a law that strengthens copyright protection in the digital realm.",
                                        "Illegal reading platforms will be required to remove content within 24 hours.",
                                        "Independent artists will have access to a piracy compensation fund."),
                                List.of(
                                        "El parlamento japonés aprobó una ley que fortalece la protección de derechos de autor en el ámbito digital.",
                                        "Las plataformas de lectura ilegales deberán remover contenido en hasta 24 horas.",
                                        "Los artistas independientes tendrán acceso a un fondo de compensación por piratería.")))
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
