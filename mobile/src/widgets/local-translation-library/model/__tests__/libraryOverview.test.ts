import type { LocalTranslationLibraryItem } from '@/entities/local-translation-result';
import type { LocalWork } from '@/entities/local-work';
import type { TranslationState } from '@/entities/translation-page';

import { buildLibraryOverview, chapterNumber, sortWorks } from '../libraryOverview';

const work = (id: string, name: string, updatedAt = 1): LocalWork => ({ id, name, coverFilename: null, createdAt: 1, updatedAt });

function item(id: string, statuses: TranslationState[], options: { position?: number | null; progressAt?: number | null; ready?: number } = {}) {
    return {
        project: {
            id,
            sourceLanguage: 'ja',
            targetLanguage: 'pt-BR',
            status: 'DRAFT',
            createdAt: 5,
            updatedAt: 5,
            statusUpdatedAt: 5,
            languageReviewRequired: false,
            pages: statuses.map((status, position) => ({
                id: `${id}-${position}`,
                projectId: id,
                position,
                originalFilename: `${position}.jpg`,
                originalByteSize: 1,
                originalMimeType: 'image/jpeg',
                widthPx: 1,
                heightPx: 1,
                mediaValidatedAt: 1,
                mediaValidationPolicyVersion: 1,
                status,
                createdAt: 5,
                updatedAt: 5,
                statusUpdatedAt: 5,
            })),
        },
        readyPages: options.ready ?? statuses.filter(status => status === 'READY').length,
        currentPosition: options.position ?? null,
        progressUpdatedAt: options.progressAt ?? null,
        coverUri: `file:///${id}.jpg`,
        demo: false,
    } as LocalTranslationLibraryItem;
}

const link = (projectId: string, workId: string, label: string) => ({ projectId, workId, label, createdAt: 2, updatedAt: 2 });

describe('MOB-FEAT-060 visão geral da biblioteca', () => {
    it('AC-001 deriva capítulos, páginas, estados e selos por obra', () => {
        const overview = buildLibraryOverview(
            [work('w1', 'Uma')],
            [[link('a', 'w1', '1'), link('b', 'w1', '2'), link('c', 'w1', '3'), link('d', 'w1', '4')]],
            [item('a', ['READY', 'READY']), item('b', ['READY', 'FAILED']), item('c', ['PROCESSING', 'QUEUED']), item('d', ['DRAFT'])],
            [],
        );
        const [entry] = overview.works;
        expect(entry.chapters.map(chapter => chapter.state)).toEqual(['saved', 'failed', 'processing', 'waiting']);
        expect(entry).toMatchObject({ pages: 7, failedChapters: 1, processingChapters: 1, languages: ['ja→pt-BR'] });
        expect(entry.chapters[1]).toMatchObject({ failedPages: 1, label: '2' });
        expect(chapterNumber(entry, 'c')).toBe(3);
    });

    it('AC-002 escolhe o capítulo lido mais recentemente para "Continuar lendo", inclusive sem obra', () => {
        const items = [item('a', ['READY', 'READY'], { position: 1, progressAt: 10 }), item('legacy', ['READY'], { position: 0, progressAt: 30 })];
        const overview = buildLibraryOverview([work('w1', 'Uma')], [[link('a', 'w1', '1')]], items, ['legacy']);
        expect(overview.continueReading).toMatchObject({ work: null, chapter: { projectId: 'legacy', currentPage: 1, label: null } });
        expect(overview.works[0].lastRead).toMatchObject({ projectId: 'a', currentPage: 2 });

        const withoutLegacy = buildLibraryOverview([work('w1', 'Uma')], [[link('a', 'w1', '1')]], items.slice(0, 1), []);
        expect(withoutLegacy.continueReading).toMatchObject({ work: { id: 'w1' }, chapter: { projectId: 'a' } });
    });

    it('AC-002 não oferece "Continuar lendo" sem progresso ou sem página pronta', () => {
        const overview = buildLibraryOverview([], [], [item('a', ['DRAFT'], { position: 0, progressAt: 3, ready: 0 }), item('b', ['READY'])], ['a', 'b']);
        expect(overview.continueReading).toBeNull();
        expect(overview.unassigned.map(chapter => chapter.projectId)).toEqual(['a', 'b']);
    });

    it('AC-003 ordena por recência ou alfabeticamente no idioma informado', () => {
        const overview = buildLibraryOverview(
            [work('w1', 'beta', 5), work('w2', 'Alfa', 1), work('w3', 'Ágata', 2)],
            [[], [link('a', 'w2', '1')], []],
            [item('a', ['READY'], { position: 0, progressAt: 50 })],
            [],
        );
        expect(sortWorks(overview.works, 'recent', 'pt-BR').map(entry => entry.work.id)).toEqual(['w2', 'w1', 'w3']);
        expect(sortWorks(overview.works, 'alpha', 'pt-BR').map(entry => entry.work.name)).toEqual(['Ágata', 'Alfa', 'beta']);
    });

    it('AC-005 lista só os capítulos sem obra e ignora vínculos sem projeto', () => {
        const overview = buildLibraryOverview([work('w1', 'Uma')], [[link('ghost', 'w1', '1')]], [item('free', ['READY'])], ['free']);
        expect(overview.works[0].chapters).toEqual([]);
        expect(overview.unassigned).toHaveLength(1);
    });
});
