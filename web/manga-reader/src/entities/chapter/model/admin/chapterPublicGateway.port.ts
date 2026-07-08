import type { ReaderChapter, ReaderProgress } from './chapterReader.types';

/**
 * Port público do leitor — consumo de capítulos pelo site.
 *
 * A implementação fake NUNCA semeia dados: com storage vazio o leitor cai no
 * fallback de placeholders atual. `'blocked'` sinaliza capítulo existente mas
 * não visível publicamente (hidden/unavailable/archived/draft/scheduled);
 * `null` sinaliza capítulo inexistente no armazenamento provisório.
 */
export interface ChapterPublicGateway {
    getReaderChapter(titleId: string, number: string, opts?: { includeUnpublished?: boolean }): Promise<ReaderChapter | 'blocked' | null>;
}

/**
 * Contrato de progresso de leitura (persistência local hoje; sincronização
 * com o backend no futuro). Formaliza as chaves `reader:pos:*` já usadas
 * pelo leitor — a implementação localStorage é compatível com o legado.
 */
export interface ReaderProgressGateway {
    saveProgress(titleId: string, chapterNumber: string, page: number): void;
    getProgress(titleId: string): ReaderProgress | null;
    markCompleted(titleId: string, chapterNumber: string): void;
    isCompleted(titleId: string, chapterNumber: string): boolean;
}
