import { z } from 'zod';

export const REMOTE_ATTEMPT_STATUSES = ['CREATED', 'SUBMITTING', 'ACCEPTED', 'REJECTED', 'UNKNOWN', 'FAILED', 'CANCEL_PENDING', 'CANCELLED'] as const;

export type RemoteAttemptStatus = (typeof REMOTE_ATTEMPT_STATUSES)[number];

export const REMOTE_JOB_STATUSES = ['QUEUED', 'OCR', 'TRANSLATING', 'RENDERING', 'READY', 'FAILED', 'CANCEL_PENDING', 'CANCELLED', 'RESULT_EXPIRED'] as const;

export type RemoteJobStatus = (typeof REMOTE_JOB_STATUSES)[number];

export const REMOTE_PROCESSING_ERROR_CODES = [
    'consent-required',
    'unsupported-pair',
    'capabilities-unavailable',
    'network-required',
    'submission-unknown',
    'gateway-rejected',
    'cancellation-pending',
    'cancellation-unavailable',
    'storage-unavailable',
] as const;

export type RemoteProcessingErrorCode = (typeof REMOTE_PROCESSING_ERROR_CODES)[number];

const gatewayErrorCodeSchema = z.enum([
    'invalid-request',
    'invalid-contract-version',
    'consent-required',
    'unsupported-pair',
    'unsupported-media-type',
    'payload-too-large',
    'capabilities-unavailable',
    'gateway-disabled',
    'unauthorized',
    'installation-revoked',
    'quota-exceeded',
    'job-not-found',
    'job-state-conflict',
    'cancellation-unavailable',
    'storage-unavailable',
    'dispatch-unavailable',
    'internal-error',
]);

export const pageJobEnvelopeSchema = z
    .object({
        contractVersion: z.literal('1.0'),
        jobRef: z.uuid(),
        status: z.enum(REMOTE_JOB_STATUSES),
        serverTime: z.iso.datetime(),
        error: z.object({ code: gatewayErrorCodeSchema, retryable: z.boolean().optional() }).strict().nullable().optional(),
    })
    .strict();

export type PageJobEnvelope = z.infer<typeof pageJobEnvelopeSchema>;

export interface RemoteProcessingConsent {
    projectId: string;
    disclosureVersion: string;
    presentedLocale: 'pt-BR' | 'en-US' | 'es-ES';
    acceptedAt: number;
}

export interface RemoteProcessingAttempt {
    id: string;
    pageId: string;
    attemptNumber: number;
    idempotencyKey: string;
    gatewayKey: string;
    gatewayContractVersion: string;
    status: RemoteAttemptStatus;
    remoteStatus: RemoteJobStatus | null;
    remoteJobRef: string | null;
    errorCode: RemoteProcessingErrorCode | null;
    createdAt: number;
    updatedAt: number;
    submittedAt: number | null;
    acceptedAt: number | null;
    lastQueriedAt: number | null;
    cancellationRequestedAt: number | null;
    cancelledAt: number | null;
}

export function isRemoteAttemptStatus(value: unknown): value is RemoteAttemptStatus {
    return typeof value === 'string' && REMOTE_ATTEMPT_STATUSES.some(status => status === value);
}

export function isRemoteJobStatus(value: unknown): value is RemoteJobStatus {
    return typeof value === 'string' && REMOTE_JOB_STATUSES.some(status => status === value);
}

export function isRemoteProcessingErrorCode(value: unknown): value is RemoteProcessingErrorCode {
    return value === null || (typeof value === 'string' && REMOTE_PROCESSING_ERROR_CODES.some(code => code === value));
}

export function isAmbiguousRemoteAttempt(attempt: RemoteProcessingAttempt): boolean {
    return attempt.status === 'SUBMITTING' || attempt.status === 'UNKNOWN' || attempt.status === 'CANCEL_PENDING';
}
