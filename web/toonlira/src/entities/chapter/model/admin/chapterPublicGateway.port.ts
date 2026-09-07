import type { ReaderChapter, ReaderProgress } from './chapterReader.types';

/**
 * Port público do leitor — consumo de capítulos pelo site.
 *
 * `'blocked'` sinaliza resposta pública 404 para conteúdo ausente ou não
 * visível; o leitor nunca inventa páginas quando a API não entrega capítulo.
 */
export interface ChapterPublicGateway {
    getReaderChapter(titleId: string, number: string, opts?: { includeUnpublished?: boolean }): Promise<ReaderChapter | 'blocked' | null>;
}

/**
 * Contrato de progresso de leitura — persistido no backend (posição de
 * página / conclusão de capítulo). `completed=true` deriva, no backend, o
 * registro do evento "capítulo lido" (idempotente lá).
 */
export interface ReaderProgressGateway {
    saveProgress(titleId: string, chapterNumber: string, page: number, totalPages: number, completed: boolean): Promise<void>;
    getProgress(titleId: string): Promise<ReaderProgress | null>;
}
