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
    'ocr-invalid-media',
    'ocr-invalid-response',
    'ocr-unavailable',
    'translation-invalid-request',
    'translation-invalid-response',
    'translation-unavailable',
    'internal-error',
]);

const privateDownloadUrlSchema = z
    .string()
    .max(8192)
    .refine(value => {
        try {
            const url = new URL(value);
            return (
                /^https:\/\/storage\.googleapis\.com\/[^?#]+\?[^#]+$/.test(value) &&
                url.protocol === 'https:' &&
                url.hostname === 'storage.googleapis.com' &&
                !url.port &&
                !url.username &&
                !url.password &&
                !url.hash &&
                url.search.length > 1
            );
        } catch {
            return false;
        }
    }, 'Invalid private download URL');

const downloadMetadata = {
    url: privateDownloadUrlSchema,
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    expiresAt: z.iso.datetime(),
};
const MAX_RESULT_PIXELS = 80000000;
const MAX_RESULT_LIFETIME_MS = 3600000;
const MAX_DOWNLOAD_LIFETIME_MS = 300000;
const readyResultSchema = z
    .object({
        manifestVersion: z.literal('1.0'),
        widthPx: z.number().int().min(1).max(12000),
        heightPx: z.number().int().min(1).max(12000),
        expiresAt: z.iso.datetime(),
        image: z
            .object({
                ...downloadMetadata,
                mimeType: z.literal('image/webp'),
                byteSize: z
                    .number()
                    .int()
                    .min(1)
                    .max(64 * 1024 * 1024),
            })
            .strict(),
        manifest: z
            .object({
                ...downloadMetadata,
                mimeType: z.literal('application/json'),
                byteSize: z
                    .number()
                    .int()
                    .min(1)
                    .max(4 * 1024 * 1024),
            })
            .strict(),
    })
    .strict();

export const pageJobEnvelopeSchema = z
    .object({
        contractVersion: z.literal('1.0'),
        jobRef: z.uuid(),
        status: z.enum(REMOTE_JOB_STATUSES),
        serverTime: z.iso.datetime(),
        error: z.object({ code: gatewayErrorCodeSchema, retryable: z.boolean().optional() }).strict().nullable().optional(),
        result: readyResultSchema.nullable().optional(),
    })
    .strict()
    .superRefine((envelope, context) => {
        const result = envelope.result;
        if (!result) return;
        const serverTime = Date.parse(envelope.serverTime);
        const resultDeadline = Date.parse(result.expiresAt);
        const downloads = [result.image, result.manifest];
        if (
            envelope.status !== 'READY' ||
            envelope.error ||
            result.widthPx * result.heightPx > MAX_RESULT_PIXELS ||
            resultDeadline <= serverTime ||
            resultDeadline > serverTime + MAX_RESULT_LIFETIME_MS ||
            downloads.some(download => {
                const expiry = Date.parse(download.expiresAt);
                return expiry <= serverTime || expiry > serverTime + MAX_DOWNLOAD_LIFETIME_MS || expiry > resultDeadline;
            })
        ) {
            context.addIssue({ code: 'custom', message: 'Invalid private result metadata', path: ['result'] });
        }
    });

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
