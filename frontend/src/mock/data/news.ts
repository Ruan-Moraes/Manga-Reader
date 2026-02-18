import type {
    NewsAuthor,
    NewsCategory,
    NewsComment,
    NewsItem,
} from '@feature/news/type/news.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date();

const addDays = (days: number, hours = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(date.getHours() + hours);
    return date.toISOString();
};

const authors: NewsAuthor[] = [
    {
        id: 'author-1',
        name: 'Yumi Azevedo',
        avatar: 'https://i.pravatar.cc/120?img=12',
        role: 'Editora de Cultura Pop',
        profileLink: '/profile',
    },
    {
        id: 'author-2',
        name: 'Kaio Tanaka',
        avatar: 'https://i.pravatar.cc/120?img=15',
        role: 'Repórter de Lançamentos',
        profileLink: '/profile',
    },
    {
        id: 'author-3',
        name: 'Lívia Nunes',
        avatar: 'https://i.pravatar.cc/120?img=21',
        role: 'Especialista em Indústria',
        profileLink: '/profile',
    },
    {
        id: 'author-4',
        name: 'Rafael Matsu',
        avatar: 'https://i.pravatar.cc/120?img=30',
        role: 'Correspondente Internacional',
        profileLink: '/profile',
    },
    {
        id: 'author-5',
        name: 'Bianca Kuroda',
        avatar: 'https://i.pravatar.cc/120?img=44',
        role: 'Apresentadora de Entrevistas',
        profileLink: '/profile',
    },
];

const commentPool = [
    'Esse anúncio foi a melhor surpresa do mês!',
    'Espero que mantenham a qualidade da adaptação.',
    'Já quero garantir na pré-venda.',
    'Ótima matéria, bem completa.',
    'Não sabia desse bastidor, sensacional.',
    'A indústria está mudando rápido no Brasil.',
    'Painel incrível, valeu cada minuto.',
    'Que venha a próxima temporada!',
];

const buildComments = (newsId: string, amount: number): NewsComment[] =>
    Array.from({ length: amount }).map((_, index) => ({
        id: `${newsId}-comment-${index + 1}`,
        user: ['Mika', 'João', 'Sakura', 'Nina', 'Haru', 'Dani'][index % 6],
        avatar: `https://i.pravatar.cc/80?img=${50 + index}`,
        content: commentPool[index % commentPool.length],
        createdAt: addDays(-(index % 10), -(index + 2)),
        likes: 5 + index * 3,
        spoiler: index % 5 === 0,
        replies:
            index % 2 === 0
                ? [
                      {
                          id: `${newsId}-reply-${index + 1}`,
                          user: 'Moderação',
                          content: 'Obrigado por compartilhar sua opinião! 💜',
                          createdAt: addDays(-(index % 8), -(index + 1)),
                      },
                  ]
                : undefined,
    }));

// ---------------------------------------------------------------------------
// Core news (hand-crafted)
// ---------------------------------------------------------------------------

const coreNews: NewsItem[] = [
    {
        id: 'news-1',
        title: 'Novo mangá de horror do criador de Junji Ito chega ao Brasil',
        subtitle: 'Editora confirma lançamento com edição especial e brindes.',
        excerpt:
            'Título inédito chega com tiragem inicial limitada, pré-venda e acabamento premium para colecionadores.',
        content: [
            'A editora anunciou oficialmente a chegada do novo mangá de horror do criador de Junji Ito ao mercado brasileiro. A obra terá acabamento capa dura e páginas coloridas no capítulo de abertura.',
            'Além do lançamento físico, a publicação contará com campanha de pré-venda e brindes exclusivos para quem comprar no primeiro lote. A estratégia busca fortalecer o crescimento do segmento de terror no país.',
            'Segundo a distribuidora, o título chegará às principais redes e lojas especializadas ainda neste trimestre.',
        ],
        coverImage: 'https://picsum.photos/1200/675?random=801',
        gallery: [
            'https://picsum.photos/900/520?random=811',
            'https://picsum.photos/900/520?random=812',
        ],
        source: 'Manga Reader News',
        sourceLogo: 'https://picsum.photos/40/40?random=901',
        category: 'Lançamentos',
        tags: ['Junji Ito', 'Panini', 'Horror', 'Seinen'],
        author: authors[1],
        publishedAt: addDays(0, -4),
        updatedAt: addDays(0, -1),
        readTime: 6,
        views: 12500,
        commentsCount: 17,
        trendingScore: 98,
        isExclusive: true,
        isFeatured: true,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        technicalSheet: {
            Mangá: 'Yami no Kakera',
            Autor: 'Junji Ito',
            Editora: 'Panini',
            Volumes: '1 (lançamento inicial)',
            'Data de lançamento': 'Março de 2026',
        },
        reactions: { like: 520, excited: 310, sad: 22, surprised: 190 },
        comments: buildComments('news-1', 12),
    },
    {
        id: 'news-2',
        title: 'Solo Leveling ganha 2ª temporada para 2025',
        subtitle: 'Estúdio confirma retorno com novo arco e visual inédito.',
        excerpt:
            'Produção revelou teaser, janela de estreia e principais nomes da equipe criativa da sequência.',
        content: [
            'Durante painel especial, foi confirmada a produção da segunda temporada de Solo Leveling para 2025.',
            'A equipe reforçou que o novo arco terá foco em confrontos maiores e mais desenvolvimento dos personagens secundários.',
            'O anúncio movimentou redes sociais e colocou a franquia entre os assuntos mais comentados do fim de semana.',
        ],
        coverImage: 'https://picsum.photos/1200/675?random=802',
        gallery: ['https://picsum.photos/900/520?random=813'],
        source: 'Anime Prime',
        sourceLogo: 'https://picsum.photos/40/40?random=902',
        category: 'Adaptações',
        tags: ['Solo Leveling', 'Anime', '2025', 'A-1 Pictures'],
        author: authors[0],
        publishedAt: addDays(-1, -3),
        readTime: 5,
        views: 18340,
        commentsCount: 23,
        trendingScore: 95,
        reactions: { like: 780, excited: 630, sad: 18, surprised: 440 },
        comments: buildComments('news-2', 10),
    },
    {
        id: 'news-3',
        title: 'Entrevistamos o tradutor de One Piece: desafios e curiosidades',
        subtitle: 'Bastidores da adaptação e escolhas culturais no Brasil.',
        excerpt:
            'Profissional conta como funciona o processo entre fidelidade ao original e adaptação para público local.',
        content: [
            'Em entrevista exclusiva, o tradutor responsável por One Piece comentou os maiores desafios do trabalho semanal.',
            'Entre os temas abordados estão trocadilhos, regionalismos e a pressão por prazos curtos.',
            'A conversa também trouxe curiosidades sobre termos que mudaram ao longo dos anos por feedback dos leitores.',
        ],
        coverImage: 'https://picsum.photos/1200/675?random=803',
        gallery: ['https://picsum.photos/900/520?random=814'],
        source: 'Otaku Insider',
        sourceLogo: 'https://picsum.photos/40/40?random=903',
        category: 'Entrevistas',
        tags: ['One Piece', 'Tradução', 'Eiichiro Oda'],
        author: authors[4],
        publishedAt: addDays(-2, -6),
        readTime: 8,
        views: 9700,
        commentsCount: 14,
        trendingScore: 89,
        reactions: { like: 412, excited: 180, sad: 8, surprised: 77 },
        comments: buildComments('news-3', 8),
    },
    {
        id: 'news-4',
        title: 'CCXP 2024: Painel da Panini anuncia 20 novos títulos',
        subtitle:
            'Editoras reforçam aposta em catálogo diversificado para 2025.',
        excerpt:
            'Painel trouxe anúncios de shonen, seinen e novos selos com foco em colecionáveis premium.',
        content: [
            'A cobertura da CCXP trouxe um pacote robusto de anúncios da Panini para os próximos meses.',
            'Foram confirmados títulos inéditos no Brasil, reimpressões aguardadas e edições especiais com extras.',
            'O público reagiu com entusiasmo principalmente às séries pedidas há anos em comunidades de leitores.',
        ],
        coverImage: 'https://picsum.photos/1200/675?random=804',
        gallery: ['https://picsum.photos/900/520?random=815'],
        source: 'Manga Reader News',
        sourceLogo: 'https://picsum.photos/40/40?random=904',
        category: 'Eventos',
        tags: ['CCXP', 'Panini', 'Lançamentos'],
        author: authors[2],
        publishedAt: addDays(-3, -3),
        readTime: 7,
        views: 15100,
        commentsCount: 29,
        trendingScore: 93,
        reactions: { like: 660, excited: 540, sad: 20, surprised: 210 },
        comments: buildComments('news-4', 11),
    },
    {
        id: 'news-5',
        title: '10 easter eggs em Attack on Titan que você nunca percebeu',
        subtitle: 'Detalhes escondidos conectam temporadas e simbolismos.',
        excerpt:
            'Análise destaca pistas visuais, referências de roteiro e mensagens no background de cenas importantes.',
        content: [
            'Attack on Titan continua rendendo análises de fãs por conta da quantidade de detalhes ocultos.',
            'Nesta lista especial, reunimos easter eggs que ajudam a reinterpretar momentos clássicos da história.',
            'As pistas envolvem design de cenário, posicionamento de personagens e escolhas de trilha sonora.',
        ],
        coverImage: 'https://picsum.photos/1200/675?random=805',
        gallery: ['https://picsum.photos/900/520?random=816'],
        source: 'Anime Prime',
        sourceLogo: 'https://picsum.photos/40/40?random=905',
        category: 'Curiosidades',
        tags: ['Attack on Titan', 'Teorias', 'Easter eggs'],
        author: authors[3],
        publishedAt: addDays(-5, -4),
        readTime: 9,
        views: 11100,
        commentsCount: 19,
        trendingScore: 85,
        reactions: { like: 398, excited: 170, sad: 40, surprised: 260 },
        comments: buildComments('news-5', 7),
    },
    {
        id: 'news-6',
        title: 'Mercado de mangás cresce 30% no Brasil em 2024',
        subtitle: 'Relatório aponta aumento de leitores e expansão do varejo.',
        excerpt:
            'Dados de mercado mostram aceleração do segmento com destaque para coleções de longa duração.',
        content: [
            'Novo estudo setorial indica crescimento de 30% no mercado de mangás no Brasil em 2024.',
            'O avanço é puxado por lançamentos simultâneos, expansão do e-commerce e maior presença em redes nacionais.',
            'Analistas projetam que a tendência continue em 2026 com novos investimentos de editoras internacionais.',
        ],
        coverImage: 'https://picsum.photos/1200/675?random=806',
        gallery: ['https://picsum.photos/900/520?random=817'],
        source: 'Geek Business',
        sourceLogo: 'https://picsum.photos/40/40?random=906',
        category: 'Mercado',
        tags: ['Mercado', 'Brasil', 'Panini', 'JBC'],
        author: authors[2],
        publishedAt: addDays(-7, -2),
        readTime: 6,
        views: 8800,
        commentsCount: 16,
        trendingScore: 82,
        reactions: { like: 301, excited: 201, sad: 11, surprised: 120 },
        comments: buildComments('news-6', 9),
    },
];

// ---------------------------------------------------------------------------
// Generated news
// ---------------------------------------------------------------------------

const extraTitles = [
    'Demon Slayer: novo filme ganha teaser internacional',
    'JBC confirma box especial de clássico shoujo',
    'Estúdio Mappa anuncia adaptação de webtoon premiado',
    'Festival do Japão terá área inédita dedicada a mangás',
    'Rumores sobre remake de anime cult agitam comunidade',
    'Vendas digitais ultrapassam impressas em plataforma japonesa',
    'Mangaká comenta rotina e saúde mental em novo documentário',
    'Ranking semanal revela domínio de títulos esportivos',
    'Nova lei impacta licenciamento de produtos geek',
    'Tokyo Game Show destaca colaboração com franquias de anime',
    'Spin-off de comédia romântica chega ao catálogo nacional',
    'Pesquisa aponta crescimento do público feminino no seinen',
    'Diretor revela segredos de produção de opening viral',
    'Streaming anuncia pacote de simulcast para primavera',
    'Convenção regional bate recorde de público no Nordeste',
    'Live-action de mangá clássico divulga elenco principal',
    'Editora confirma reimpressão de volumes esgotados',
    'Entrevista: colorista fala sobre processo digital em mangás',
    'Especialista aponta tendências de consumo otaku para 2026',
    'Análise: por que os isekais seguem em alta no mercado',
    'Novo app promete leitura simultânea com o Japão',
    'Autores brasileiros ganham destaque em feira internacional',
    'Calendário de estreias de outubro é atualizado',
    'Bastidores da dublagem do anime mais comentado do mês',
];

const extraCategories: NewsCategory[] = [
    'Adaptações',
    'Lançamentos',
    'Indústria',
    'Eventos',
    'Curiosidades',
    'Mercado',
    'Entrevistas',
    'Internacional',
];

const extraNews: NewsItem[] = extraTitles.map((title, index) => {
    const id = `news-${index + 7}`;
    const category = extraCategories[index % extraCategories.length];
    const commentAmount = 5 + (index % 8);

    const technicalSheet: Record<string, string> | undefined =
        category === 'Lançamentos'
            ? {
                  Mangá: 'Série Especial',
                  Autor: 'Autor convidado',
                  Editora: 'Selo Original',
                  Volumes: `${1 + (index % 8)}`,
                  'Data de lançamento': 'Q2 2026',
              }
            : category === 'Adaptações'
              ? {
                    Anime: 'Projeto Especial',
                    Estúdio: 'Studio Nexus',
                    Diretor: 'Ken Morita',
                    Elenco: 'Aoi Hana, Reiji Kato',
                    'Data de estreia': '2026',
                }
              : undefined;

    return {
        id,
        title,
        subtitle:
            'Cobertura rápida com análises e impactos para fãs e mercado.',
        excerpt:
            'Resumo com contexto, dados e próximos passos sobre a notícia para leitores acompanharem os desdobramentos.',
        content: [
            'A pauta desta semana traz atualizações importantes para o público que acompanha o cenário otaku e geek.',
            'Fontes do setor apontam impactos diretos em lançamentos, agenda de eventos e estratégias de distribuição.',
            'Seguiremos monitorando os próximos anúncios e atualizaremos esta matéria com novos detalhes.',
        ],
        coverImage: `https://picsum.photos/1200/675?random=${900 + index}`,
        gallery: [
            `https://picsum.photos/900/520?random=${980 + index}`,
            `https://picsum.photos/900/520?random=${1080 + index}`,
        ],
        source: [
            'Manga Reader News',
            'Anime Prime',
            'Otaku Insider',
            'Geek Business',
        ][index % 4],
        sourceLogo: `https://picsum.photos/40/40?random=${940 + index}`,
        category,
        tags: [
            'One Piece',
            'Jujutsu Kaisen',
            'Panini',
            'Shonen',
            'Seinen',
        ].slice(0, 2 + (index % 3)),
        author: authors[index % authors.length],
        publishedAt: addDays(-(index + 1), -(index % 12)),
        readTime: 4 + (index % 7),
        views: 3200 + index * 530,
        commentsCount: commentAmount,
        trendingScore: 50 + (index % 50),
        reactions: {
            like: 100 + index * 11,
            excited: 70 + index * 9,
            sad: 4 + (index % 17),
            surprised: 30 + index * 5,
        },
        comments: buildComments(id, commentAmount),
        technicalSheet,
    };
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const mockNews: NewsItem[] = [...coreNews, ...extraNews];
