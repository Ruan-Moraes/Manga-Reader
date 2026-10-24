import type { AdminChapter, ChapterPage, ChapterPageFormat } from '../../model/admin/chapterAdmin.types';

import { createSeededRandom, hashString, type SeededRandom } from './seededRandom';

/**
 * Armazenamento provisório de capítulos (localStorage) — substituível.
 *
 * Faz o papel de "servidor" do domínio de capítulos enquanto o backend real
 * não existe (DT-44): persiste estado, semeia dados demo determinísticos por
 * obra, simula latência de rede e o pipeline de processamento de páginas.
 *
 * Nada fora de `entities/chapter/api/admin` deve importar este módulo — os
 * consumidores usam os gateways, que implementam os ports do domínio.
 */

export type ChapterStoreState = {
    chapters: AdminChapter[];
    pages: ChapterPage[];
    /** Obras já semeadas — o seed roda uma única vez por obra. */
    seededTitleIds: string[];
};

export type ChapterStoreOptions = {
    /** Default: window.localStorage. Injete um fake nos testes. */
    storage?: Storage;
    /** Relógio injetável (lazy promotion de agendados e timestamps). */
    now?: () => Date;
    /** Latência simulada em ms — número fixo ou faixa [min, max]. 0 nos testes. */
    latencyMs?: number | [number, number];
    /** Fração de páginas que falham no processamento (0 = nunca). */
    failRate?: number;
    /** Duração de cada etapa do pipeline (uploading→processing→ready). */
    processingStepMs?: number;
    /** Sal do PRNG do seed demo. */
    seed?: number;
};

export const CHAPTER_STORE_KEY = 'mr:chapters:admin:v1';

const DEFAULT_LATENCY: [number, number] = [80, 250];
const DEFAULT_PROCESSING_STEP_MS = 900;

/** Nomes demo para as obras do seed do backend (ids '1'..'10'). Somente exibição. */
const DEMO_TITLE_NAMES: Record<string, string> = {
    '1': 'Reino de Aço',
    '2': 'Lâmina do Amanhã',
    '3': 'Flores de Inverno',
    '4': 'O Último Portal',
    '5': 'Cinzas do Dragão',
    '6': 'Maré Sombria',
    '7': 'Coração de Ferro',
    '8': 'Vento do Leste',
    '9': 'A Torre Silenciosa',
    '10': 'Estrela Cadente',
};

export type ChapterStore = {
    read(): ChapterStoreState;
    /** Aplica a mutação e persiste UMA vez; propaga o retorno do mutator. */
    write<T>(mutate: (state: ChapterStoreState) => T): T;
    ensureSeededForTitle(titleId: string): void;
    /** Semeia o catálogo demo completo (uma vez). Chamado só pelo gateway ADMIN. */
    ensureSeededCatalog(): void;
    delay(): Promise<void>;
    now(): Date;
    titleNameFor(titleId: string, hint?: string): string;
    /** Agenda as transições uploading→processing→ready|error de uma página. */
    schedulePageProcessing(pageId: string): void;
    newId(prefix: string): string;
    buildFakeImage(pageId: string, rng?: SeededRandom): Pick<ChapterPage, 'imageUrl' | 'thumbnailUrl' | 'width' | 'height' | 'fileSize' | 'format'>;
    reset(): void;
};

const emptyState = (): ChapterStoreState => ({ chapters: [], pages: [], seededTitleIds: [] });

export const createChapterStore = (options: ChapterStoreOptions = {}): ChapterStore => {
    // Resolvido por acesso (não na criação): o singleton é construído no load
    // do módulo e `window` não pode ser tocado em ambiente sem DOM.
    const getStorage = () => options.storage ?? window.localStorage;
    const nowFn = options.now ?? (() => new Date());
    const latency = options.latencyMs ?? DEFAULT_LATENCY;
    const failRate = options.failRate ?? 0;
    const stepMs = options.processingStepMs ?? DEFAULT_PROCESSING_STEP_MS;
    const seedSalt = options.seed ?? 20260704;

    let idCounter = 0;
    let processedPagesCount = 0;

    const load = (): ChapterStoreState => {
        try {
            const raw = getStorage().getItem(CHAPTER_STORE_KEY);
            if (!raw) return emptyState();
            const parsed = JSON.parse(raw) as ChapterStoreState;
            return { ...emptyState(), ...parsed };
        } catch {
            return emptyState();
        }
    };

    const save = (state: ChapterStoreState) => {
        try {
            getStorage().setItem(CHAPTER_STORE_KEY, JSON.stringify(state));
        } catch {
            /* quota/indisponível — estado segue em memória até a próxima escrita */
        }
    };

    /** Promove agendados vencidos a publicados (comportamento provisório — no backend será job). */
    const promoteScheduled = (state: ChapterStoreState): boolean => {
        const nowIso = nowFn().toISOString();
        let changed = false;
        for (const chapter of state.chapters) {
            if (chapter.status === 'scheduled' && chapter.scheduledAt && chapter.scheduledAt <= nowIso) {
                chapter.status = 'published';
                chapter.publishedAt = chapter.scheduledAt;
                chapter.scheduledAt = null;
                chapter.updatedAt = nowIso;
                changed = true;
            }
        }
        return changed;
    };

    const read = (): ChapterStoreState => {
        const state = load();
        if (promoteScheduled(state)) save(state);
        return state;
    };

    const write = <T,>(mutate: (state: ChapterStoreState) => T): T => {
        const state = load();
        promoteScheduled(state);
        const result = mutate(state);
        save(state);
        return result;
    };

    const newId = (prefix: string): string => `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

    const titleNameFor = (titleId: string, hint?: string): string => hint ?? DEMO_TITLE_NAMES[titleId] ?? `Obra ${titleId}`;

    const buildFakeImage: ChapterStore['buildFakeImage'] = (pageId, rng) => {
        const r = rng ?? createSeededRandom(hashString(pageId));
        const width = r.pick([760, 800, 840, 900]);
        const height = r.int(1080, 1400);
        const format: ChapterPageFormat = r.pick(['jpg', 'png', 'webp']);
        return {
            imageUrl: `https://picsum.photos/seed/${pageId}/${width}/${height}`,
            thumbnailUrl: `https://picsum.photos/seed/${pageId}/${Math.round(width / 4)}/${Math.round(height / 4)}`,
            width,
            height,
            fileSize: r.int(180_000, 950_000),
            format,
        };
    };

    const seedTitle = (state: ChapterStoreState, titleId: string) => {
        if (state.seededTitleIds.includes(titleId)) return;

        const rng = createSeededRandom(hashString(`${titleId}:${seedSalt}`));
        const chapterCount = rng.int(5, 12);
        const baseDate = new Date('2026-01-05T12:00:00Z').getTime();
        const titleName = titleNameFor(titleId);

        for (let n = 1; n <= chapterCount; n++) {
            const id = `seed_${titleId}_${n}`;
            // Últimos capítulos variam de status; o miolo fica publicado.
            const roll = rng.next();
            const isLast = n === chapterCount;
            const status = isLast && roll < 0.5 ? 'draft' : roll < 0.08 ? 'hidden' : roll < 0.12 ? 'unavailable' : 'published';
            const createdAt = new Date(baseDate + n * 86_400_000 * rng.int(3, 6)).toISOString();
            const published = status === 'published';

            const pagesCount = rng.int(8, 20);
            if (status !== 'draft') {
                for (let p = 1; p <= pagesCount; p++) {
                    const pageId = `${id}_p${p}`;
                    const image = buildFakeImage(pageId, rng);
                    state.pages.push({
                        id: pageId,
                        chapterId: id,
                        order: p,
                        originalFilename: `cap${String(n).padStart(3, '0')}_pg${String(p).padStart(2, '0')}.${image.format}`,
                        processingStatus: 'ready',
                        createdAt,
                        updatedAt: createdAt,
                        ...image,
                    });
                }
            }

            state.chapters.push({
                id,
                titleId,
                titleName,
                title: `Capítulo ${n}`,
                number: String(n),
                displayOrder: n,
                description: null,
                status,
                pagesCount: status === 'draft' ? 0 : pagesCount,
                readyPagesCount: status === 'draft' ? 0 : pagesCount,
                publishedAt: published ? createdAt : null,
                scheduledAt: null,
                reads: published ? rng.int(400, 48_000) : 0,
                completionRate: published ? rng.int(45, 96) / 100 : 0,
                createdAt,
                updatedAt: createdAt,
                createdBy: 'seed',
                updatedBy: null,
                deletedAt: null,
            });
        }

        state.seededTitleIds.push(titleId);
    };

    const ensureSeededForTitle = (titleId: string) => {
        const state = load();
        if (state.seededTitleIds.includes(titleId)) return;
        write(s => seedTitle(s, titleId));
    };

    const ensureSeededCatalog = () => {
        const state = load();
        const pending = Object.keys(DEMO_TITLE_NAMES).filter(id => !state.seededTitleIds.includes(id));
        if (!pending.length) return;
        write(s => pending.forEach(id => seedTitle(s, id)));
    };

    const delay = (): Promise<void> => {
        const ms = Array.isArray(latency) ? latency[0] + Math.random() * (latency[1] - latency[0]) : latency;
        if (ms <= 0) return Promise.resolve();
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    const advancePage = (pageId: string, to: ChapterPage['processingStatus']) => {
        write(state => {
            const page = state.pages.find(p => p.id === pageId);
            if (!page || page.processingStatus === 'ready' || page.processingStatus === 'error') return;
            page.processingStatus = to;
            page.updatedAt = nowFn().toISOString();
            if (to === 'ready' || to === 'error') {
                const chapter = state.chapters.find(c => c.id === page.chapterId);
                if (chapter) {
                    chapter.readyPagesCount = state.pages.filter(p => p.chapterId === chapter.id && p.processingStatus === 'ready').length;
                    chapter.updatedAt = page.updatedAt;
                }
            }
        });
    };

    const schedulePageProcessing = (pageId: string) => {
        processedPagesCount++;
        const shouldFail = failRate > 0 && processedPagesCount % Math.max(1, Math.round(1 / failRate)) === 0;
        setTimeout(() => advancePage(pageId, 'processing'), stepMs);
        setTimeout(() => advancePage(pageId, shouldFail ? 'error' : 'ready'), stepMs * 2);
    };

    return {
        read,
        write,
        ensureSeededForTitle,
        ensureSeededCatalog,
        delay,
        now: () => nowFn(),
        titleNameFor,
        schedulePageProcessing,
        newId,
        buildFakeImage,
        reset: () => getStorage().removeItem(CHAPTER_STORE_KEY),
    };
};
