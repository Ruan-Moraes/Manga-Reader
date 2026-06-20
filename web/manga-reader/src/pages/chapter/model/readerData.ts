/**
 * Dados de exemplo do leitor — espelham o protótipo do handoff
 * (01-capitulos-leitor/design/ReaderPage.jsx.txt).
 *
 * São amostras locais, como no protótipo. No app real, troque por dados via
 * React Query: páginas/lista de capítulos por `titleId` e comentários do
 * capítulo pelo módulo unificado de comentários (`@entities/comment`,
 * `targetType` = capítulo).
 */

/** Total de páginas do capítulo (placeholder — virá da API). */
export const TOTAL_PAGES = 18;

/** Gradiente do placeholder de página (substituível por `<img>` real). */
export const PAGE_GRADIENT = 'linear-gradient(135deg,#2a1f0f,#161616)';

export interface InlineMarkerComment {
    user: string;
    initials: string;
    color: string;
    when: string;
    text: string;
}

export interface InlineMarker {
    count: number;
    top: InlineMarkerComment;
}

/** Marcadores de comentário por página (modo vertical). */
export const INLINE_MARKERS: Record<number, InlineMarker> = {
    5: {
        count: 12,
        top: {
            user: 'Akari',
            initials: 'AK',
            color: '#ddda2a',
            when: 'há 2 horas',
            text: 'A construção do painel da pg. 5 é absurda — começa em close fechado e o splash da pg. seguinte muda a escala inteira.',
        },
    },
    12: {
        count: 8,
        top: {
            user: 'Kenji_99',
            initials: 'KJ',
            color: '#FF784F',
            when: 'há 4 horas',
            text: 'Spoiler leve do próximo capítulo na última fala — ninguém comentou isso ainda?',
        },
    },
};

