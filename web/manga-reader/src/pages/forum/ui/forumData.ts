/**
 * Dados de exemplo do fórum — espelham o protótipo do handoff
 * (03-forum/design/data-forum.js). São amostras locais, como no protótipo.
 * No app real, troque por dados via React Query (`@entities/forum`) — tópicos,
 * comentários, categorias e stats — mantendo este shape de view.
 */

export type TagTone = 'accent' | 'danger' | 'info' | 'neutral' | 'pink' | 'violet' | 'cyan' | 'green';
export type UserRole = 'mod' | 'admin' | null;

export interface ForumCategory {
    key: string;
    label: string;
    icon: string;
    count: number;
}

export interface ForumUser {
    id: string;
    name: string;
    handle: string;
    initials: string;
    color: string;
    level: number;
    badge: string | null;
    role: UserRole;
}

export interface ForumTag {
    label: string;
    tone: TagTone;
}

export interface ForumTopic {
    id: string;
    pinned?: boolean;
    hot?: boolean;
    title: string;
    excerpt: string;
    category: string;
    tags: string[];
    authorId: string;
    when: string;
    replies: number;
    views: number;
    lastReplyAt: string;
    lastUserId: string;
    reactions: { up: number; down: number };
    hasSpoilerContent?: boolean;
}

export interface ForumComment {
    id: string;
    userId: string;
    when: string;
    edited?: boolean;
    text: string;
    reactions: { up: number; down: number };
    isOP?: boolean;
    role?: UserRole;
    replies?: ForumComment[];
}

export const FORUM_CATEGORIES: ForumCategory[] = [
    { key: 'home', label: 'Home do fórum', icon: 'home', count: 12483 },
    { key: 'discussao', label: 'Discussões gerais', icon: 'forum', count: 4821 },
    { key: 'manga', label: 'Mangás', icon: 'library', count: 3214 },
    { key: 'manhwa', label: 'Manhwas', icon: 'library', count: 2108 },
    { key: 'manhua', label: 'Manhuas', icon: 'library', count: 942 },
    { key: 'novel', label: 'Novels', icon: 'news', count: 612 },
    { key: 'spoilers', label: 'Spoilers', icon: 'eye', count: 1843 },
    { key: 'teorias', label: 'Teorias', icon: 'sparkle', count: 1297 },
    { key: 'recs', label: 'Recomendações', icon: 'heart', count: 988 },
    { key: 'noticias', label: 'Notícias', icon: 'news', count: 463 },
    { key: 'offtopic', label: 'Off-topic', icon: 'comment', count: 1521 },
    { key: 'eventos', label: 'Eventos', icon: 'calendar', count: 184 },
    { key: 'staff', label: 'Staff & Anúncios', icon: 'bell', count: 27 },
];

export const FORUM_TAGS: Record<string, ForumTag> = {
    spoiler: { label: 'Spoiler', tone: 'danger' },
    teoria: { label: 'Teoria', tone: 'accent' },
    ajuda: { label: 'Ajuda', tone: 'info' },
    discussao: { label: 'Discussão', tone: 'neutral' },
    vazamento: { label: 'Vazamento', tone: 'danger' },
    anime: { label: 'Anime', tone: 'pink' },
    capitulo: { label: 'Capítulo', tone: 'accent' },
    novel: { label: 'Novel', tone: 'violet' },
    evento: { label: 'Evento', tone: 'cyan' },
    recomendacao: { label: 'Recomendação', tone: 'green' },
};

export const FORUM_USERS: Record<string, ForumUser> = {
    ak: { id: 'ak', name: 'AkariReads', handle: 'akarireads', initials: 'AK', color: 'var(--mr-accent)', level: 42, badge: 'Top Reader', role: null },
    kj: { id: 'kj', name: 'Kenji_99', handle: 'kenji99', initials: 'KJ', color: '#FF784F', level: 28, badge: null, role: null },
    yl: { id: 'yl', name: 'YukiLove', handle: 'yukilove', initials: 'YL', color: '#cccccc', level: 35, badge: 'Postador', role: null },
    rm: { id: 'rm', name: 'Ruan Moraes', handle: 'ruanmoraes', initials: 'RM', color: 'var(--mr-accent)', level: 18, badge: null, role: 'admin' },
    tk: { id: 'tk', name: 'TakeshiScan', handle: 'takeshiscan', initials: 'TK', color: '#3a2a10', level: 51, badge: 'Tradutor', role: 'mod' },
    hl: { id: 'hl', name: 'Helena_Lin', handle: 'helenalin', initials: 'HL', color: '#1f3a2a', level: 24, badge: null, role: null },
    bs: { id: 'bs', name: 'BerserkSensei', handle: 'berserksensei', initials: 'BS', color: '#3a1f1f', level: 67, badge: 'Veterano', role: 'mod' },
    jp: { id: 'jp', name: 'João Pedro', handle: 'jpzin', initials: 'JP', color: '#2a3a1f', level: 9, badge: null, role: null },
    mz: { id: 'mz', name: 'MizukiOfficial', handle: 'mizuki', initials: 'MZ', color: '#2a1f3a', level: 14, badge: null, role: null },
};

export const FORUM_TOPICS: ForumTopic[] = [
    {
        id: 't1', pinned: true, hot: true,
        title: 'Atualizamos as regras do fórum — leia antes de postar',
        excerpt: 'Pequenos ajustes nas regras de spoilers e recomendação. Resumo: spoilers de capítulos com menos de 7 dias precisam de tag obrigatória. Detalhes no tópico.',
        category: 'staff', tags: ['discussao'], authorId: 'rm', when: 'há 2 dias',
        replies: 184, views: 8721, lastReplyAt: 'há 12 min', lastUserId: 'tk', reactions: { up: 612, down: 4 },
    },
    {
        id: 't2', hot: true,
        title: 'Cap. 1120 de One Piece — o sino de Wano e a profecia de Roger',
        excerpt: 'Acho que finalmente entendi o paralelo entre o sino de Skypiea e o de Wano. Quem mais notou que o ritmo dos badaladas é o mesmo da fala do Joy Boy? Vou explicar minha teoria abaixo — atenção, contém spoilers do capítulo mais recente.',
        category: 'spoilers', tags: ['spoiler', 'teoria', 'capitulo'], authorId: 'ak', when: 'há 4 horas',
        replies: 421, views: 12482, lastReplyAt: 'há 3 min', lastUserId: 'bs', reactions: { up: 482, down: 12 }, hasSpoilerContent: true,
    },
    {
        id: 't3',
        title: 'Por que Frieren funciona tão bem sem pressa nenhuma?',
        excerpt: 'Comecei a leitura semana passada e estou apaixonada pelo ritmo contemplativo. Como uma obra com tão poucos picos dramáticos consegue te prender desse jeito? Queria ouvir o que vocês acham do desenho de personagens dela.',
        category: 'discussao', tags: ['discussao'], authorId: 'yl', when: 'há 8 horas',
        replies: 87, views: 3214, lastReplyAt: 'há 22 min', lastUserId: 'ak', reactions: { up: 198, down: 2 },
    },
    {
        id: 't4',
        title: 'Recomendações de manhwa de ação curtinho (até 200 cap)',
        excerpt: 'Cansei de começar manhwa de 800 capítulos. Procurando algo com começo, meio e fim, ação no estilo Solo Leveling, sem necessariamente sistema. Sugestões?',
        category: 'recs', tags: ['recomendacao', 'ajuda'], authorId: 'jp', when: 'há 1 dia',
        replies: 42, views: 1872, lastReplyAt: 'há 1 hora', lastUserId: 'hl', reactions: { up: 64, down: 0 },
    },
    {
        id: 't5',
        title: 'VAZOU: 5 páginas do próximo capítulo de Chainsaw Man',
        excerpt: 'Apareceu na 4chan há 2 horas. Não vou postar as imagens aqui (regra do fórum) mas dá pra discutir o que está acontecendo. Marque com spoiler nas respostas.',
        category: 'spoilers', tags: ['vazamento', 'spoiler'], authorId: 'tk', when: 'há 3 horas',
        replies: 312, views: 9408, lastReplyAt: 'há 8 min', lastUserId: 'ak', reactions: { up: 244, down: 31 }, hasSpoilerContent: true,
    },
    {
        id: 't6',
        title: 'Solo Leveling — adaptação animada está à altura do manhwa?',
        excerpt: 'Acabei de terminar a primeira temporada do anime. Fiquei dividido. Algumas cenas ficaram absurdas, outras pareceram apressadas. Qual a opinião de quem leu o manhwa antes?',
        category: 'manhwa', tags: ['anime', 'discussao'], authorId: 'kj', when: 'há 2 dias',
        replies: 156, views: 4821, lastReplyAt: 'há 2 horas', lastUserId: 'mz', reactions: { up: 89, down: 14 },
    },
    {
        id: 't7',
        title: 'Como vocês organizam a biblioteca? Procurando dicas',
        excerpt: 'Tenho 240 obras na biblioteca e ficou impossível encontrar nada. Vocês usam alguma estratégia de tags? Coleções? Como vocês evitam o caos?',
        category: 'discussao', tags: ['ajuda', 'discussao'], authorId: 'hl', when: 'há 3 dias',
        replies: 28, views: 942, lastReplyAt: 'há 5 horas', lastUserId: 'jp', reactions: { up: 47, down: 1 },
    },
    {
        id: 't8',
        title: 'Berserk pós-Miura: estou pronto pra continuar?',
        excerpt: 'Parei na morte do Miura. Voltei a ler os capítulos do Studio Gaga e fiquei impressionado. Mas tenho amigos que abandonaram completamente. Como vocês estão lidando?',
        category: 'manga', tags: ['discussao'], authorId: 'bs', when: 'há 5 dias',
        replies: 198, views: 6231, lastReplyAt: 'há 4 horas', lastUserId: 'ak', reactions: { up: 312, down: 8 },
    },
];

export const FORUM_COMMENTS: ForumComment[] = [
    {
        id: 'c1', userId: 'ak', when: 'há 4 horas', edited: false, isOP: true, reactions: { up: 482, down: 12 },
        text: 'Pra deixar registrado: tudo abaixo deste comentário contém spoilers do capítulo 1120. Vou marcar com [spoiler] os trechos mais críticos. Se você ainda não leu, fecha essa aba.\n\nO paralelo que eu quero discutir é específico: a sequência de badaladas que o Oda usou em Skypiea (cap. 301) é exatamente a mesma do tropel rítmico do Joy Boy quando ele aparece em "fragmento" no cap. 1044.',
    },
    {
        id: 'c2', userId: 'bs', when: 'há 3 horas', role: 'mod', reactions: { up: 156, down: 2 },
        text: 'Boa, AK. [spoiler] Notei a mesma coisa relendo o arco. O detalhe é que o ritmo aparece DENTRO de uma sequência de painéis em silêncio — o Oda só faz isso quando vai amarrar um foreshadowing de muito longo prazo. Aposto que vamos ver o sino de novo em Laugh Tale. [/spoiler]',
        replies: [
            { id: 'c2-r1', userId: 'ak', when: 'há 2 horas', text: 'Exatamente esse o ponto. O silêncio narrativo do Oda nunca é gratuito.', reactions: { up: 42, down: 0 } },
            { id: 'c2-r2', userId: 'jp', when: 'há 1 hora', text: 'Mano, vocês dois deviam abrir um podcast. Eu pago.', reactions: { up: 28, down: 0 } },
        ],
    },
    {
        id: 'c3', userId: 'kj', when: 'há 2 horas', edited: true, reactions: { up: 98, down: 6 },
        text: 'Discordo da leitura do paralelo direto, mas concordo que o sino é foreshadowing. Pra mim ele aponta pra um sistema de "voz" — algo como uma frequência que só os "ouvintes" da Cosmologia conseguem captar. Lembra do Roger ouvindo as baleias?',
    },
    {
        id: 'c4', userId: 'hl', when: 'há 1 hora', reactions: { up: 14, down: 1 },
        text: 'Adoro essas discussões mas confesso que perdi o fio da meada nos últimos arcos. Alguém tem um resumo dos últimos 50 capítulos pra eu voltar pro ritmo?',
    },
    {
        id: 'c5', userId: 'tk', when: 'há 22 min', role: 'mod', reactions: { up: 211, down: 3 },
        text: '[spoiler] Pessoal, lembrem que o cap. 1120 não saiu oficial ainda na CR. Os vazamentos são reais mas a tradução que está circulando tem erros sérios no nome do antagonista. Espera o oficial pra discutir os detalhes finos. [/spoiler]',
    },
];

export const FORUM_TRENDING = [
    { id: 't2', title: 'Cap. 1120 de One Piece — o sino de Wano', replies: 421, trend: '+218' },
    { id: 't5', title: 'VAZOU: 5 páginas do próximo capítulo de CSM', replies: 312, trend: '+186' },
    { id: 't8', title: 'Berserk pós-Miura: estou pronto pra continuar?', replies: 198, trend: '+92' },
    { id: 't6', title: 'Solo Leveling — adaptação animada está à altura?', replies: 156, trend: '+47' },
];

export const FORUM_RECENT_COMMENTS = [
    { topicId: 't2', userId: 'bs', when: 'há 3 min', text: 'Boa, AK. Notei a mesma coisa relendo o arco…' },
    { topicId: 't5', userId: 'ak', when: 'há 8 min', text: 'Pera, alguém confirmou se o vazamento é de fato…' },
    { topicId: 't1', userId: 'tk', when: 'há 12 min', text: 'Atualizei a thread fixada com FAQ de moderação.' },
    { topicId: 't3', userId: 'ak', when: 'há 22 min', text: 'Tem cena no cap. 87 que resume o que você falou.' },
];

export const FORUM_RANKING = [
    { userId: 'ak', posts: 42, points: 1240 },
    { userId: 'bs', posts: 38, points: 1098 },
    { userId: 'tk', posts: 31, points: 876 },
    { userId: 'yl', posts: 24, points: 612 },
    { userId: 'kj', posts: 18, points: 408 },
];

export const FORUM_EVENTS = [
    { id: 'e1', when: 'Sábado, 20h', title: 'Leitura coletiva: Vinland Saga vol. 1', badge: 'Ao vivo' },
    { id: 'e2', when: 'Segunda, 19h', title: 'AMA com tradutor da Mangás Brasil', badge: 'Especial' },
    { id: 'e3', when: 'Próx. quinta', title: 'Torneio de previsões — final de JJK', badge: 'Inscrições' },
];

export const FORUM_STATS = { online: 3241, topicsToday: 87, commentsToday: 2143, newUsers: 124 };

export const formatViews = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`;
    return String(n);
};

const parseTime = (s: string): number => {
    if (s.includes('min')) return parseInt(s) || 0;
    if (s.includes('hora')) return (parseInt(s) || 1) * 60;
    if (s.includes('ontem')) return 1440;
    if (s.includes('dia')) return (parseInt(s) || 1) * 1440;
    return 99999;
};

export type ForumTab = 'alta' | 'recentes' | 'sem-resposta' | 'comentados' | 'seguindo' | 'fixados';

export const filterAndSortTopics = (category: string, tab: ForumTab): ForumTopic[] => {
    const filtered = FORUM_TOPICS.filter(t => {
        if (category !== 'home' && t.category !== category) return false;
        if (tab === 'sem-resposta' && t.replies > 0) return false;
        if (tab === 'fixados' && !t.pinned) return false;
        return true;
    });
    return [...filtered].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (tab === 'recentes') return parseTime(a.when) - parseTime(b.when);
        if (tab === 'comentados') return b.replies - a.replies;
        return (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || b.replies - a.replies;
    });
};
