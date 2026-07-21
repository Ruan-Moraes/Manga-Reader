/**
 * Dados de exemplo de eventos — espelham o protótipo do handoff
 * (04-eventos/design/data-events.js). Eventos comunitários/sazonais (especiais +
 * normais) com countdown — modelo distinto do `EventData` real (convenções/ingressos).
 * No app real, mapeie para a fonte definitiva via React Query (`@entities/event`).
 */

export type EventKind = 'special' | 'normal';
export type EventLiveStatus = 'upcoming' | 'active' | 'ended';

export interface CommunityEvent {
    id: string;
    type: EventKind;
    name: string;
    tagline?: string;
    description: string;
    cover: string;
    start: string;
    end: string;
    badge?: string;
    accent?: string;
    rewards?: string[];
    participants?: number;
    chapters?: number;
}

export const eventStatus = (ev: CommunityEvent, now = new Date()): EventLiveStatus => {
    const start = new Date(`${ev.start}T00:00:00`);
    const end = new Date(`${ev.end}T23:59:59`);
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'active';
};

const fmtBR = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y.slice(2)}`;
};

export const fmtRange = (s: string, e: string): string => {
    if (s === e) return fmtBR(s);
    const [, sm, sd] = s.split('-');
    const [, em, ed] = e.split('-');
    if (sm === em) return `${sd}–${ed}/${sm}`;
    return `${sd}/${sm} – ${ed}/${em}`;
};

export const EVENTS: CommunityEvent[] = [
    {
        id: 'evt-shounen-arena', type: 'special',
        name: 'Shounen Arena: Torneio dos Heróis',
        tagline: 'O maior crossover de shounens do ano',
        description: 'Quatro semanas de batalhas em capítulos exclusivos, ranking semanal da comunidade e recompensas raras para quem participar até o fim.',
        cover: 'linear-gradient(135deg,#ff784f 0%,var(--mr-accent) 100%)',
        start: '2026-05-01', end: '2026-05-31', badge: 'Especial', accent: 'var(--mr-danger)',
        rewards: ['Avatar exclusivo', 'Capítulo bônus', 'Badge de perfil'], participants: 12847, chapters: 24,
    },
    {
        id: 'evt-aniversario', type: 'special',
        name: 'Aniversário Manga Reader: 3 anos',
        tagline: 'Três anos lendo junto. Tem festa.',
        description: 'Capítulos liberados, sorteios diários, lives com tradutores, e um grand finale com obra inédita revelada na última noite.',
        cover: 'linear-gradient(135deg,#7c3aed 0%,var(--mr-accent) 100%)',
        start: '2026-04-20', end: '2026-05-20', badge: 'Especial', accent: 'var(--mr-accent)',
        rewards: ['10 capítulos premium grátis', 'Sorteio de mangás físicos', 'Tema escuro neon'], participants: 38291, chapters: 60,
    },
    {
        id: 'evt-halloween', type: 'special',
        name: 'Noite Sombria: Especial Horror',
        tagline: 'Mangás de terror em destaque',
        description: 'Curadoria de horror clássico e moderno com leituras guiadas, debates por capítulo e capa dark mode exclusiva durante o evento.',
        cover: 'linear-gradient(135deg,#3a1f47 0%,#ff784f 100%)',
        start: '2026-10-20', end: '2026-11-02', badge: 'Especial', accent: '#a855f7',
        rewards: ['Tema noturno', 'Avatar fantasma', 'Coleção horror'], participants: 0, chapters: 14,
    },
    {
        id: 'evt-leitura-coletiva-fr', type: 'normal',
        name: 'Leitura coletiva: Fire Force',
        description: 'Cinco capítulos por dia, discussões abertas no fórum.',
        cover: 'var(--mr-danger)', start: '2026-05-05', end: '2026-05-12', chapters: 35,
    },
    {
        id: 'evt-clube-shoujo', type: 'normal',
        name: 'Clube do mês: Shoujo clássico',
        description: 'Curadoria de cinco shoujos dos anos 90 para revisitar.',
        cover: '#ec4899', start: '2026-05-01', end: '2026-05-31', chapters: 48,
    },
    {
        id: 'evt-quiz-otaku', type: 'normal',
        name: 'Quiz Otaku Semanal',
        description: 'Trinta perguntas. Ranking sobe na sexta. Top 10 ganha avatar.',
        cover: 'var(--mr-accent)', start: '2026-05-08', end: '2026-05-08', chapters: 0,
    },
    {
        id: 'evt-fanart-marco', type: 'normal',
        name: 'Concurso de fanart: Março',
        description: 'Tema livre. Júri da comunidade vota até dia 31.',
        cover: '#3b82f6', start: '2026-03-01', end: '2026-03-31', chapters: 0,
    },
    {
        id: 'evt-maratona-isekai', type: 'normal',
        name: 'Maratona Isekai',
        description: 'Trinta e seis horas de leitura ininterrupta com badges por hora.',
        cover: 'var(--mr-success)', start: '2026-06-15', end: '2026-06-16', chapters: 120,
    },
    {
        id: 'evt-traducao-aberta', type: 'normal',
        name: 'Tradução aberta: Capítulo 1000',
        description: 'Acompanhe a tradução ao vivo com os scans parceiros.',
        cover: '#06b6d4', start: '2026-05-15', end: '2026-05-15', chapters: 1,
    },
];

export const findEvent = (id: string | undefined): CommunityEvent | undefined => EVENTS.find(e => e.id === id);
