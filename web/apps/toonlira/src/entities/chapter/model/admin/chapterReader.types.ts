import type { ChapterStatus } from './chapterAdmin.types';

/**
 * Contratos públicos do leitor — o que o site consome de um capítulo publicado.
 * Só páginas `ready` chegam aqui, já ordenadas.
 */

export type ReaderPage = {
    id: string;
    order: number;
    imageUrl: string;
    thumbnailUrl: string;
    width: number;
    height: number;
};

export type ReaderChapter = {
    id: string;
    titleId: string;
    number: string;
    title: string;
    status: ChapterStatus;
    pages: ReaderPage[];
};

/** Progresso de leitura persistido localmente (contrato p/ futura sincronização). */
export type ReaderProgress = {
    chapter: number;
    page: number;
};
