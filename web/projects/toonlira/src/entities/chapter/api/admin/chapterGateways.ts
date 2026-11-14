import type { ChapterAdminGateway } from '../../model/admin/chapterAdminGateway.port';
import type { ChapterAnalyticsGateway } from '../../model/admin/chapterAnalyticsGateway.port';
import type { ChapterPublicGateway, ReaderProgressGateway } from '../../model/admin/chapterPublicGateway.port';

import { createHttpChapterAdminGateway } from './httpChapterAdminGateway';
import { createHttpChapterAnalyticsGateway } from './httpChapterAnalyticsGateway';
import { createHttpChapterPublicGateway } from './httpChapterPublicGateway';
import { createHttpReaderProgressGateway } from './httpReaderProgressGateway';

/** Ponto único de injeção dos gateways HTTP de capítulos e progresso. */
export const chapterAdminGateway: ChapterAdminGateway = createHttpChapterAdminGateway();
export const chapterPublicGateway: ChapterPublicGateway = createHttpChapterPublicGateway();
export const chapterAnalyticsGateway: ChapterAnalyticsGateway = createHttpChapterAnalyticsGateway(chapterAdminGateway);
export const readerProgressGateway: ReaderProgressGateway = createHttpReaderProgressGateway();
