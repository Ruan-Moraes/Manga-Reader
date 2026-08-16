import {
    type LocalMediaImportDraft,
    type LocalMediaImportRepository,
    PENDING_MEDIA_VALIDATION,
    type TranslationLanguagePair,
} from '@/src/entities/local-media-import';

import { createSelectTranslationLanguagesController, SelectTranslationLanguagesError } from '../selectTranslationLanguages';

const draft = (overrides: Partial<LocalMediaImportDraft> = {}): LocalMediaImportDraft => ({
    id: 'draft-1',
    createdAt: 1,
    updatedAt: 10,
    confirmedAt: 5,
    sourceLanguage: 'ja',
    targetLanguage: 'pt-BR',
    languagesConfirmedAt: null,
    items: [{ ...PENDING_MEDIA_VALIDATION, id: 'item-1', position: 0, localFilename: 'item-1', byteSize: 10, mimeHint: null, createdAt: 1 }],
    ...overrides,
});

function setup(options: { failure?: Error } = {}) {
    let active = draft();
    const repository = {
        getActive: jest.fn(async () => active),
        updateLanguages: jest.fn(async (_draftId: string, pair: TranslationLanguagePair, updatedAt: number, expectedUpdatedAt: number) => {
            if (options.failure) throw options.failure;
            if (expectedUpdatedAt !== active.updatedAt) throw new Error('localMediaImport.staleDraft');
            active = { ...active, ...pair, updatedAt, languagesConfirmedAt: null };
            return active;
        }),
        confirmLanguages: jest.fn(async (_draftId: string, confirmedAt: number, expectedUpdatedAt: number) => {
            if (options.failure) throw options.failure;
            if (expectedUpdatedAt !== active.updatedAt) throw new Error('localMediaImport.staleDraft');
            active = { ...active, updatedAt: confirmedAt, languagesConfirmedAt: confirmedAt };
            return active;
        }),
    } as unknown as LocalMediaImportRepository;
    const controller = createSelectTranslationLanguagesController({ repository, now: () => 100 });
    return { controller, repository, getActive: () => active };
}

describe('MOB-FEAT-014 translation language controller', () => {
    it('persists source and target independently and confirms the current pair', async () => {
        const { controller, repository } = setup();

        const changed = await controller.update(draft(), { sourceLanguage: 'ko', targetLanguage: 'zh-Hant' });
        expect(changed).toMatchObject({ sourceLanguage: 'ko', targetLanguage: 'zh-Hant', languagesConfirmedAt: null, updatedAt: 100 });
        expect(repository.updateLanguages).toHaveBeenCalledWith('draft-1', { sourceLanguage: 'ko', targetLanguage: 'zh-Hant' }, 100, 10);

        await expect(controller.confirm(changed)).resolves.toMatchObject({ sourceLanguage: 'ko', targetLanguage: 'zh-Hant', languagesConfirmedAt: 100 });
        expect(repository.confirmLanguages).toHaveBeenCalledWith('draft-1', 100, 100);
    });

    it('rejects equal languages before touching persistence', async () => {
        const { controller, repository } = setup();

        await expect(controller.update(draft(), { sourceLanguage: 'en', targetLanguage: 'en' })).rejects.toEqual(
            new SelectTranslationLanguagesError('same-language'),
        );
        expect(repository.updateLanguages).not.toHaveBeenCalled();
    });

    it.each([
        ['localMediaImport.reviewRequired', 'review-required'],
        ['localMediaImport.staleDraft', 'stale-draft'],
        ['native sqlite detail', 'storage-unavailable'],
    ] as const)('maps repository failure %s without leaking its detail', async (message, code) => {
        const { controller } = setup({ failure: new Error(message) });

        await expect(controller.update(draft(), { sourceLanguage: 'es', targetLanguage: 'en' })).rejects.toEqual(new SelectTranslationLanguagesError(code));
    });

    it('coalesces repeated actions while persistence is in flight', async () => {
        let resolve!: (value: LocalMediaImportDraft) => void;
        const pending = new Promise<LocalMediaImportDraft>(done => {
            resolve = done;
        });
        const repository = {
            updateLanguages: jest.fn(() => pending),
            getActive: jest.fn(async () => draft()),
        } as unknown as LocalMediaImportRepository;
        const controller = createSelectTranslationLanguagesController({ repository, now: () => 100 });
        const first = controller.update(draft(), { sourceLanguage: 'en', targetLanguage: 'pt-BR' });
        const second = controller.update(draft(), { sourceLanguage: 'es', targetLanguage: 'en' });

        expect(repository.updateLanguages).toHaveBeenCalledTimes(1);
        resolve(draft({ sourceLanguage: 'en', updatedAt: 100 }));
        await expect(first).resolves.toMatchObject({ sourceLanguage: 'en' });
        await expect(second).resolves.toMatchObject({ sourceLanguage: 'en' });
    });
});
