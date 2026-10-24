import { formatDateTime } from '@shared/lib/formatters';

import formatRelativeDate, { parseApiDate } from './formatRelativeDate';

export interface PostDate {
    /** Tempo relativo, visível no header (ex.: "há 3 dias"). */
    label: string;
    /** Dia + hora absolutos, locale-aware, para tooltip (ex.: "07 de jun. de 2026, 14:32"). */
    title: string;
}

/**
 * Data canônica de post/comentário: relativo para exibir + absoluto para o tooltip.
 * Normaliza nanos do ISO da API (ver `parseApiDate`) antes de formatar o absoluto —
 * `formatDateTime` puro retornaria vazio para frações com mais de 3 dígitos.
 */
export const formatPostDate = (iso?: string): PostDate => {
    if (!iso) return { label: '', title: '' };

    const date = parseApiDate(iso);

    return {
        label: formatRelativeDate(iso),
        title: date ? formatDateTime(date) : '',
    };
};

export default formatPostDate;
