import type { ChapterAdminGateway } from '../../model/admin/chapterAdminGateway.port';
import type { ChapterAnalyticsGateway } from '../../model/admin/chapterAnalyticsGateway.port';
import type { ChapterPublicGateway, ReaderProgressGateway } from '../../model/admin/chapterPublicGateway.port';

import { createChapterStore } from './localStorageChapterStore';
import { createLocalStorageChapterAdminGateway } from './localStorageChapterAdminGateway';
import { createLocalStorageChapterAnalyticsGateway } from './localStorageChapterAnalyticsGateway';
import { createLocalStorageChapterPublicGateway, createLocalStorageReaderProgressGateway } from './localStorageChapterPublicGateway';

/**
 * PONTO DE INJEÇÃO do armazenamento de capítulos.
 *
 * Hoje: implementações fake sobre localStorage (armazenamento definitivo
 * adiado — DT-44). Quando o backend expor `/api/admin/titles/{id}/chapters`,
 * troque as factories abaixo por services axios que implementem os mesmos
 * ports — nenhum componente, hook ou validação muda.
 */
const store = createChapterStore();

export const chapterAdminGateway: ChapterAdminGateway = createLocalStorageChapterAdminGateway(store);
export const chapterPublicGateway: ChapterPublicGateway = createLocalStorageChapterPublicGateway(store);
export const chapterAnalyticsGateway: ChapterAnalyticsGateway = createLocalStorageChapterAnalyticsGateway(store);
export const readerProgressGateway: ReaderProgressGateway = createLocalStorageReaderProgressGateway();
