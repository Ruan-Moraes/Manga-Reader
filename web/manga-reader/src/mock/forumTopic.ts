import type { TopicData, ReplyData } from '@entities/forum';

// ISO relativo a "agora" — mantém os labels relativos coerentes a cada carga
// (os componentes formatam: relativo visível + tooltip dia+hora).
const hoursAgo = (h: number): string => new Date(Date.now() - h * 3_600_000).toISOString();
const minutesAgo = (m: number): string => new Date(Date.now() - m * 60_000).toISOString();

export const TOPICS: Record<string, TopicData> = {
    '2': {
        id: '2',
        title: 'Poll: Qual o melhor arco de One Piece até agora?',
        category: 'One Piece',
        pinned: true,
        author: {
            name: 'luffy_d_garp',
            handle: '@luffygarp',
            badge: undefined,
        },
        postedAt: hoursAgo(3),
        views: 4800,
        replies: 187,
        live: 12,
        content:
            'Galera, com o arco de Egghead chegando ao fim e Oda preparando o próximo, queria saber qual vocês consideram o melhor arco da série até hoje.\n\nMinha escolha pessoal é Marineford pela tensão absurda e o impacto emocional, mas Wano é concorrência pesada pela execução visual.\n\nDeixem sua opinião nos comentários!',
    },
    '3': {
        id: '3',
        title: 'Teoria: O que aconteceu com o pai do Guts no capítulo 370?',
        category: 'Berserk',
        pinned: false,
        author: { name: 'darkfan92', handle: '@darkfan', badge: undefined },
        postedAt: hoursAgo(5),
        edited: true,
        updatedAt: hoursAgo(4),
        views: 1200,
        replies: 42,
        live: 3,
        content:
            'Depois de reler o capítulo 370 três vezes, acho que a Studio Gaga deixou uma pista sutil sobre as origens de Guts que Miura nunca chegou a desenvolver explicitamente.\n\nA cicatriz no rosto do cavaleiro sem nome bate exatamente com a descrição dos bandidos da infância do Guts. Pode ser coincidência, mas não acho.',
    },
};

export const REPLIES: ReplyData[] = [
    {
        id: 'r1',
        author: { name: 'nakama_forever', handle: '@nakama', badge: undefined },
        when: hoursAgo(2),
        upvotes: 134,
        downvotes: 8,
        children: 'Marineford sem dúvida. A morte do Ace ainda dói depois de todos esses anos.',
    },
    {
        id: 'r2',
        author: { name: 'zoro_sensei', handle: '@zoro', badge: undefined },
        when: hoursAgo(1),
        edited: true,
        updatedAt: minutesAgo(30),
        upvotes: 98,
        downvotes: 3,
        children: 'Wano foi visualmente lindo mas narrativamente inconsistente. Enies Lobby bate facilmente.',
    },
    {
        id: 'r3',
        author: { name: 'mod_br', handle: '@modbr', badge: 'mod' as const },
        when: minutesAgo(45),
        upvotes: 67,
        downvotes: 1,
        children: 'Lembrem que spoilers do capítulo mais recente devem ter tag adequada. Bom debate!',
    },
];
