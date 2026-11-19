import type { RemoteProcessingAttempt } from '@/entities/remote-processing-attempt';
import type { TranslationProject } from '@/entities/translation-project';

import { BATCH_SIZE, MAX_ACTIVE_JOBS, nextPageToSend, nextQuotaRenewal } from '../remoteQueue';

type Status = TranslationProject['pages'][number]['status'];

function project(statuses: readonly Status[], status: TranslationProject['status'] = 'PROCESSING'): TranslationProject {
    return {
        id: 'project',
        sourceLanguage: 'en',
        targetLanguage: 'pt-BR',
        status,
        createdAt: 1,
        updatedAt: 1,
        statusUpdatedAt: 1,
        languageReviewRequired: false,
        pages: statuses
            .map((pageStatus, position) => ({
                id: `page-${position}`,
                projectId: 'project',
                position,
                originalFilename: `p${position}`,
                originalByteSize: 1,
                originalMimeType: 'image/png' as const,
                widthPx: 1,
                heightPx: 1,
                mediaValidatedAt: 1,
                mediaValidationPolicyVersion: 1,
                status: pageStatus,
                createdAt: 1,
                updatedAt: 1,
                statusUpdatedAt: 1,
            }))
            .reverse(),
    };
}

function accepted(position: number, remoteStatus: RemoteProcessingAttempt['remoteStatus'], acceptedAt = position): RemoteProcessingAttempt {
    return {
        id: `attempt-${position}`,
        pageId: `page-${position}`,
        attemptNumber: 1,
        idempotencyKey: `key-${position}`,
        gatewayKey: 'gateway',
        gatewayContractVersion: '1.0',
        status: 'ACCEPTED',
        remoteStatus,
        remoteJobRef: `job-${position}`,
        errorCode: null,
        createdAt: 1,
        updatedAt: 1,
        submittedAt: 1,
        acceptedAt,
        lastQueriedAt: null,
        cancellationRequestedAt: null,
        cancelledAt: null,
        resultAcknowledgedAt: null,
    };
}

describe('MOB-FEAT-022/AC-001/003 reading order, window and batches', () => {
    it('starts with the first page in reading order', () => {
        expect(nextPageToSend(project(['DRAFT', 'DRAFT'], 'DRAFT'), [], 0, null).page?.id).toBe('page-0');
    });

    it('waits until the previous page is past translation, so its names are in the chapter memory', () => {
        expect(nextPageToSend(project(['PROCESSING', 'DRAFT']), [accepted(0, 'TRANSLATING')], 0, null)).toEqual({ page: null, hold: 'translating' });
        expect(nextPageToSend(project(['PROCESSING', 'DRAFT']), [accepted(0, 'RENDERING')], 0, null).page?.id).toBe('page-1');
    });

    it(`never runs more than ${MAX_ACTIVE_JOBS} pages of the project at once`, () => {
        const decision = nextPageToSend(project(['PROCESSING', 'PROCESSING', 'DRAFT']), [accepted(0, 'READY'), accepted(1, 'RENDERING')], 0, null);
        expect(decision).toEqual({ page: null, hold: 'window-full' });
    });

    it(`starts batch 2 only when all ${BATCH_SIZE} pages of batch 1 settled`, () => {
        const statuses: Status[] = ['READY', 'READY', 'READY', 'FAILED', 'PROCESSING', 'DRAFT'];
        expect(nextPageToSend(project(statuses), [accepted(4, 'READY')], 0, null)).toEqual({ page: null, hold: 'batch' });
        const settled: Status[] = ['READY', 'READY', 'READY', 'FAILED', 'READY', 'DRAFT'];
        expect(nextPageToSend(project(settled), [], 0, null).page?.id).toBe('page-5');
    });

    it('holds while a submission is still unconfirmed', () => {
        const unknown = { ...accepted(0, null), status: 'UNKNOWN' as const, remoteJobRef: null };
        expect(nextPageToSend(project(['DRAFT', 'DRAFT']), [unknown], 0, null)).toEqual({ page: null, hold: 'reconciling' });
    });

    it('sends nothing for a cancelled or finished project', () => {
        expect(nextPageToSend(project(['READY', 'DRAFT'], 'CANCELLED'), [], 0, null).hold).toBe('finished');
        expect(nextPageToSend(project(['READY', 'READY'], 'READY'), [], 0, null).hold).toBe('finished');
    });
});

describe('MOB-FEAT-022/AC-004 quota pause', () => {
    it('pauses until the next midnight UTC and resumes after it', () => {
        const now = Date.UTC(2026, 10, 18, 23, 30);
        const until = nextQuotaRenewal(now);
        expect(until).toBe(Date.UTC(2026, 10, 19));
        expect(nextPageToSend(project(['DRAFT']), [], now, until)).toEqual({ page: null, hold: 'paused' });
        expect(nextPageToSend(project(['DRAFT']), [], until, until).page?.id).toBe('page-0');
    });
});
