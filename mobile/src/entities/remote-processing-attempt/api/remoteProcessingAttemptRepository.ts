import { type TranslationProjectRepository, translationProjectRepository } from '@/entities/translation-project/@x/remote-processing-attempt';
import { advanceAppSchemaVersion, type AppDatabase, openAppDatabase, runAppDatabaseMigration, type SqlExecutor } from '@/shared/storage';

import {
    isRemoteAttemptStatus,
    isRemoteJobStatus,
    isRemoteProcessingErrorCode,
    type RemoteJobStatus,
    type RemoteProcessingAttempt,
    type RemoteProcessingConsent,
    type RemoteProcessingErrorCode,
} from '../model/remoteProcessingAttempt';

const CURRENT_SCHEMA_VERSION = 7;
const ATTEMPT_STATUS_CHECK = "'CREATED', 'SUBMITTING', 'ACCEPTED', 'REJECTED', 'UNKNOWN', 'FAILED', 'CANCEL_PENDING', 'CANCELLED'";
const REMOTE_STATUS_CHECK = "'QUEUED', 'OCR', 'TRANSLATING', 'RENDERING', 'READY', 'FAILED', 'CANCEL_PENDING', 'CANCELLED', 'RESULT_EXPIRED'";
const ERROR_CODE_CHECK =
    "'consent-required', 'unsupported-pair', 'capabilities-unavailable', 'network-required', 'submission-unknown', 'gateway-rejected', 'cancellation-pending', 'cancellation-unavailable', 'storage-unavailable'";

export const CREATE_REMOTE_PROCESSING_SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS remote_processing_consents (
    project_id TEXT NOT NULL,
    disclosure_version TEXT NOT NULL CHECK (length(disclosure_version) BETWEEN 1 AND 64),
    presented_locale TEXT NOT NULL CHECK (presented_locale IN ('pt-BR', 'en-US', 'es-ES')),
    accepted_at INTEGER NOT NULL CHECK (accepted_at > 0),
    CONSTRAINT pk_remote_processing_consents PRIMARY KEY (project_id, disclosure_version),
    CONSTRAINT fk_remote_processing_consents_project FOREIGN KEY (project_id) REFERENCES translation_projects(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS remote_processing_attempts (
    id TEXT PRIMARY KEY NOT NULL,
    page_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
    idempotency_key TEXT NOT NULL UNIQUE,
    gateway_key TEXT NOT NULL CHECK (length(gateway_key) BETWEEN 2 AND 63),
    gateway_contract_version TEXT NOT NULL CHECK (length(gateway_contract_version) BETWEEN 1 AND 32),
    status TEXT NOT NULL CHECK (status IN (${ATTEMPT_STATUS_CHECK})),
    remote_status TEXT CHECK (remote_status IS NULL OR remote_status IN (${REMOTE_STATUS_CHECK})),
    remote_job_ref TEXT,
    error_code TEXT CHECK (error_code IS NULL OR error_code IN (${ERROR_CODE_CHECK})),
    created_at INTEGER NOT NULL CHECK (created_at > 0),
    updated_at INTEGER NOT NULL CHECK (updated_at >= created_at),
    submitted_at INTEGER CHECK (submitted_at IS NULL OR submitted_at BETWEEN created_at AND updated_at),
    accepted_at INTEGER CHECK (accepted_at IS NULL OR accepted_at BETWEEN created_at AND updated_at),
    last_queried_at INTEGER CHECK (last_queried_at IS NULL OR last_queried_at BETWEEN created_at AND updated_at),
    cancellation_requested_at INTEGER CHECK (cancellation_requested_at IS NULL OR cancellation_requested_at BETWEEN created_at AND updated_at),
    cancelled_at INTEGER CHECK (cancelled_at IS NULL OR cancelled_at BETWEEN created_at AND updated_at),
    CONSTRAINT fk_remote_processing_attempts_page FOREIGN KEY (page_id) REFERENCES translation_pages(id) ON DELETE CASCADE,
    CONSTRAINT uk_remote_processing_attempts_number UNIQUE (page_id, attempt_number),
    CONSTRAINT uk_remote_processing_attempts_job UNIQUE (gateway_key, remote_job_ref),
    CONSTRAINT chk_remote_processing_attempts_receipt CHECK (
        (status IN ('ACCEPTED', 'CANCEL_PENDING', 'CANCELLED') AND remote_job_ref IS NOT NULL AND accepted_at IS NOT NULL)
        OR status NOT IN ('ACCEPTED', 'CANCEL_PENDING', 'CANCELLED')
    ),
    CONSTRAINT chk_remote_processing_attempts_remote_ref CHECK (remote_status IS NULL OR remote_job_ref IS NOT NULL),
    CONSTRAINT chk_remote_processing_attempts_cancelled CHECK (
        (status = 'CANCELLED' AND remote_status = 'CANCELLED' AND cancelled_at IS NOT NULL)
        OR status <> 'CANCELLED'
    )
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_remote_processing_attempts_active_page
    ON remote_processing_attempts(page_id)
    WHERE status IN ('CREATED', 'SUBMITTING', 'ACCEPTED', 'UNKNOWN', 'CANCEL_PENDING');
`;

interface AttemptRow {
    id: string;
    page_id: string;
    attempt_number: number;
    idempotency_key: string;
    gateway_key: string;
    gateway_contract_version: string;
    status: string;
    remote_status: string | null;
    remote_job_ref: string | null;
    error_code: string | null;
    created_at: number;
    updated_at: number;
    submitted_at: number | null;
    accepted_at: number | null;
    last_queried_at: number | null;
    cancellation_requested_at: number | null;
    cancelled_at: number | null;
}

export interface NewRemoteProcessingAttempt {
    id: string;
    pageId: string;
    idempotencyKey: string;
    gatewayKey: string;
    gatewayContractVersion: string;
    createdAt: number;
}

export interface RemoteProcessingAttemptRepository {
    initialize(): Promise<void>;
    saveConsent(consent: RemoteProcessingConsent): Promise<void>;
    getConsent(projectId: string, disclosureVersion: string): Promise<RemoteProcessingConsent | null>;
    createOrGetActive(attempt: NewRemoteProcessingAttempt): Promise<RemoteProcessingAttempt>;
    getById(id: string): Promise<RemoteProcessingAttempt | null>;
    getActiveByPage(pageId: string): Promise<RemoteProcessingAttempt | null>;
    getLatestByPage(pageId: string): Promise<RemoteProcessingAttempt | null>;
    getProjectIdForPage(pageId: string): Promise<string | null>;
    listRecoverable(): Promise<RemoteProcessingAttempt[]>;
    markSubmitting(id: string, now: number): Promise<RemoteProcessingAttempt>;
    markUnknown(id: string, now: number, errorCode?: RemoteProcessingErrorCode): Promise<RemoteProcessingAttempt>;
    markRejected(id: string, now: number, errorCode: RemoteProcessingErrorCode): Promise<RemoteProcessingAttempt>;
    acceptAndQueue(id: string, projectId: string, pageId: string, jobRef: string, remoteStatus: RemoteJobStatus, now: number): Promise<RemoteProcessingAttempt>;
    observe(id: string, remoteStatus: RemoteJobStatus, now: number, errorCode?: RemoteProcessingErrorCode | null): Promise<RemoteProcessingAttempt>;
    markCancelPending(id: string, now: number): Promise<RemoteProcessingAttempt>;
    confirmCancelled(id: string, projectId: string, pageId: string, now: number): Promise<RemoteProcessingAttempt>;
}

const ATTEMPT_COLUMNS = `id, page_id, attempt_number, idempotency_key, gateway_key, gateway_contract_version,
    status, remote_status, remote_job_ref, error_code, created_at, updated_at, submitted_at, accepted_at,
    last_queried_at, cancellation_requested_at, cancelled_at`;

function mapAttempt(row: AttemptRow | null): RemoteProcessingAttempt | null {
    if (!row) return null;
    if (
        !isRemoteAttemptStatus(row.status) ||
        (row.remote_status !== null && !isRemoteJobStatus(row.remote_status)) ||
        !isRemoteProcessingErrorCode(row.error_code)
    ) {
        throw new Error('remoteProcessing.invalidStoredValue');
    }
    return {
        id: row.id,
        pageId: row.page_id,
        attemptNumber: row.attempt_number,
        idempotencyKey: row.idempotency_key,
        gatewayKey: row.gateway_key,
        gatewayContractVersion: row.gateway_contract_version,
        status: row.status,
        remoteStatus: row.remote_status,
        remoteJobRef: row.remote_job_ref,
        errorCode: row.error_code,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        submittedAt: row.submitted_at,
        acceptedAt: row.accepted_at,
        lastQueriedAt: row.last_queried_at,
        cancellationRequestedAt: row.cancellation_requested_at,
        cancelledAt: row.cancelled_at,
    };
}

async function getAttempt(executor: SqlExecutor, id: string): Promise<RemoteProcessingAttempt | null> {
    return mapAttempt(await executor.getFirstAsync<AttemptRow>(`SELECT ${ATTEMPT_COLUMNS} FROM remote_processing_attempts WHERE id = ? LIMIT 1`, [id]));
}

async function requireAttempt(executor: SqlExecutor, id: string): Promise<RemoteProcessingAttempt> {
    const attempt = await getAttempt(executor, id);
    if (!attempt) throw new Error('remoteProcessing.attemptNotFound');
    return attempt;
}

export function createSqliteRemoteProcessingAttemptRepository(
    openDatabase: () => Promise<AppDatabase> = openAppDatabase,
    projects: Pick<TranslationProjectRepository, 'initialize'> = translationProjectRepository,
): RemoteProcessingAttemptRepository {
    let initialized: Promise<void> | null = null;
    const database = async () => {
        await projects.initialize();
        const db = await openDatabase();
        initialized ??= runAppDatabaseMigration(async () => {
            await db.execAsync('PRAGMA foreign_keys = ON;');
            await db.withExclusiveTransactionAsync(async transaction => {
                await transaction.execAsync(CREATE_REMOTE_PROCESSING_SCHEMA);
                await advanceAppSchemaVersion(transaction, CURRENT_SCHEMA_VERSION);
            });
        }).catch(error => {
            initialized = null;
            throw error;
        });
        await initialized;
        return db;
    };

    return {
        async initialize() {
            await database();
        },
        async saveConsent(consent) {
            await (
                await database()
            ).runAsync(
                `INSERT INTO remote_processing_consents (project_id, disclosure_version, presented_locale, accepted_at)
                 VALUES (?, ?, ?, ?)
                 ON CONFLICT(project_id, disclosure_version) DO NOTHING`,
                [consent.projectId, consent.disclosureVersion, consent.presentedLocale, consent.acceptedAt],
            );
        },
        async getConsent(projectId, disclosureVersion) {
            const row = await (
                await database()
            ).getFirstAsync<{
                project_id: string;
                disclosure_version: string;
                presented_locale: RemoteProcessingConsent['presentedLocale'];
                accepted_at: number;
            }>(
                `SELECT project_id, disclosure_version, presented_locale, accepted_at
                 FROM remote_processing_consents WHERE project_id = ? AND disclosure_version = ? LIMIT 1`,
                [projectId, disclosureVersion],
            );
            return row
                ? { projectId: row.project_id, disclosureVersion: row.disclosure_version, presentedLocale: row.presented_locale, acceptedAt: row.accepted_at }
                : null;
        },
        async createOrGetActive(candidate) {
            const db = await database();
            let result: RemoteProcessingAttempt | null = null;
            await db.withExclusiveTransactionAsync(async transaction => {
                result = mapAttempt(
                    await transaction.getFirstAsync<AttemptRow>(
                        `SELECT ${ATTEMPT_COLUMNS} FROM remote_processing_attempts
                         WHERE page_id = ? AND status IN ('CREATED', 'SUBMITTING', 'ACCEPTED', 'UNKNOWN', 'CANCEL_PENDING') LIMIT 1`,
                        [candidate.pageId],
                    ),
                );
                if (result) return;
                const number = await transaction.getFirstAsync<{ next_number: number }>(
                    'SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_number FROM remote_processing_attempts WHERE page_id = ?',
                    [candidate.pageId],
                );
                await transaction.runAsync(
                    `INSERT INTO remote_processing_attempts
                     (id, page_id, attempt_number, idempotency_key, gateway_key, gateway_contract_version, status, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, 'CREATED', ?, ?)`,
                    [
                        candidate.id,
                        candidate.pageId,
                        number?.next_number ?? 1,
                        candidate.idempotencyKey,
                        candidate.gatewayKey,
                        candidate.gatewayContractVersion,
                        candidate.createdAt,
                        candidate.createdAt,
                    ],
                );
                result = await requireAttempt(transaction, candidate.id);
            });
            if (!result) throw new Error('remoteProcessing.storageUnavailable');
            return result;
        },
        async getById(id) {
            return getAttempt(await database(), id);
        },
        async getActiveByPage(pageId) {
            return mapAttempt(
                await (
                    await database()
                ).getFirstAsync<AttemptRow>(
                    `SELECT ${ATTEMPT_COLUMNS} FROM remote_processing_attempts
                     WHERE page_id = ? AND status IN ('CREATED', 'SUBMITTING', 'ACCEPTED', 'UNKNOWN', 'CANCEL_PENDING') LIMIT 1`,
                    [pageId],
                ),
            );
        },
        async getLatestByPage(pageId) {
            return mapAttempt(
                await (
                    await database()
                ).getFirstAsync<AttemptRow>(
                    `SELECT ${ATTEMPT_COLUMNS} FROM remote_processing_attempts
                     WHERE page_id = ? ORDER BY attempt_number DESC LIMIT 1`,
                    [pageId],
                ),
            );
        },
        async getProjectIdForPage(pageId) {
            const row = await (
                await database()
            ).getFirstAsync<{ project_id: string }>('SELECT project_id FROM translation_pages WHERE id = ? LIMIT 1', [pageId]);
            return row?.project_id ?? null;
        },
        async listRecoverable() {
            const rows = await (
                await database()
            ).getAllAsync<AttemptRow>(
                `SELECT ${ATTEMPT_COLUMNS} FROM remote_processing_attempts
                 WHERE status IN ('SUBMITTING', 'UNKNOWN', 'CANCEL_PENDING') ORDER BY updated_at ASC`,
                [],
            );
            return rows.map(row => mapAttempt(row)!);
        },
        async markSubmitting(id, now) {
            const db = await database();
            await db.runAsync(
                `UPDATE remote_processing_attempts SET status = 'SUBMITTING', submitted_at = COALESCE(submitted_at, ?), updated_at = ?, error_code = NULL
                 WHERE id = ? AND status IN ('CREATED', 'UNKNOWN')`,
                [now, now, id],
            );
            return requireAttempt(db, id);
        },
        async markUnknown(id, now, errorCode = 'submission-unknown') {
            const db = await database();
            await db.runAsync(
                `UPDATE remote_processing_attempts SET status = 'UNKNOWN', updated_at = ?, last_queried_at = ?, error_code = ?
                 WHERE id = ? AND status IN ('CREATED', 'SUBMITTING', 'UNKNOWN')`,
                [now, now, errorCode, id],
            );
            return requireAttempt(db, id);
        },
        async markRejected(id, now, errorCode) {
            const db = await database();
            await db.runAsync(
                `UPDATE remote_processing_attempts SET status = 'REJECTED', updated_at = ?, error_code = ?
                 WHERE id = ? AND status IN ('CREATED', 'SUBMITTING', 'UNKNOWN')`,
                [now, errorCode, id],
            );
            return requireAttempt(db, id);
        },
        async acceptAndQueue(id, projectId, pageId, jobRef, remoteStatus, now) {
            const db = await database();
            await db.withExclusiveTransactionAsync(async transaction => {
                const attempt = await requireAttempt(transaction, id);
                if (attempt.status === 'ACCEPTED' && attempt.remoteJobRef === jobRef) return;
                if (!['CREATED', 'SUBMITTING', 'UNKNOWN'].includes(attempt.status)) throw new Error('remoteProcessing.invalidTransition');
                if (attempt.pageId !== pageId) throw new Error('remoteProcessing.staleProject');
                const page = await transaction.getFirstAsync<{ page_status: string; project_status: string; language_review_required: number }>(
                    `SELECT p.status AS page_status, pr.status AS project_status, pr.language_review_required
                     FROM translation_pages p JOIN translation_projects pr ON pr.id = p.project_id
                     WHERE p.id = ? AND p.project_id = ? LIMIT 1`,
                    [pageId, projectId],
                );
                if (!page || page.page_status !== 'DRAFT' || page.project_status !== 'DRAFT' || page.language_review_required !== 0) {
                    throw new Error('remoteProcessing.staleProject');
                }
                await transaction.runAsync(
                    `UPDATE remote_processing_attempts
                     SET status = 'ACCEPTED', remote_status = ?, remote_job_ref = ?, accepted_at = ?, updated_at = ?, error_code = NULL
                     WHERE id = ?`,
                    [remoteStatus, jobRef, now, now, id],
                );
                await transaction.runAsync(
                    `UPDATE translation_pages SET status = 'QUEUED', updated_at = ?, status_updated_at = ?
                     WHERE id = ? AND project_id = ? AND status = 'DRAFT'`,
                    [now, now, pageId, projectId],
                );
                await transaction.runAsync(
                    `UPDATE translation_projects SET status = 'QUEUED', updated_at = ?, status_updated_at = ?
                     WHERE id = ? AND status = 'DRAFT' AND language_review_required = 0`,
                    [now, now, projectId],
                );
            });
            return requireAttempt(db, id);
        },
        async observe(id, remoteStatus, now, errorCode = null) {
            const db = await database();
            await db.runAsync(`UPDATE remote_processing_attempts SET remote_status = ?, last_queried_at = ?, updated_at = ?, error_code = ? WHERE id = ?`, [
                remoteStatus,
                now,
                now,
                errorCode,
                id,
            ]);
            return requireAttempt(db, id);
        },
        async markCancelPending(id, now) {
            const db = await database();
            await db.runAsync(
                `UPDATE remote_processing_attempts
                 SET status = 'CANCEL_PENDING', remote_status = 'CANCEL_PENDING', cancellation_requested_at = COALESCE(cancellation_requested_at, ?),
                     updated_at = ?, error_code = 'cancellation-pending'
                 WHERE id = ? AND status IN ('ACCEPTED', 'CANCEL_PENDING')`,
                [now, now, id],
            );
            return requireAttempt(db, id);
        },
        async confirmCancelled(id, projectId, pageId, now) {
            const db = await database();
            await db.withExclusiveTransactionAsync(async transaction => {
                const attempt = await requireAttempt(transaction, id);
                if (attempt.status === 'CANCELLED') return;
                if (!attempt.remoteJobRef || !['ACCEPTED', 'CANCEL_PENDING'].includes(attempt.status)) throw new Error('remoteProcessing.invalidTransition');
                if (attempt.pageId !== pageId) throw new Error('remoteProcessing.staleProject');
                await transaction.runAsync(
                    `UPDATE remote_processing_attempts
                     SET status = 'CANCELLED', remote_status = 'CANCELLED', cancelled_at = ?, last_queried_at = ?, updated_at = ?, error_code = NULL
                     WHERE id = ?`,
                    [now, now, now, id],
                );
                await transaction.runAsync(
                    `UPDATE translation_pages SET status = 'CANCELLED', updated_at = ?, status_updated_at = ?
                     WHERE id = ? AND project_id = ? AND status IN ('DRAFT', 'QUEUED', 'PROCESSING', 'FAILED')`,
                    [now, now, pageId, projectId],
                );
                await transaction.runAsync(
                    `UPDATE translation_projects SET status = 'CANCELLED', updated_at = ?, status_updated_at = ?
                     WHERE id = ? AND status IN ('DRAFT', 'QUEUED', 'PROCESSING', 'FAILED')`,
                    [now, now, projectId],
                );
            });
            return requireAttempt(db, id);
        },
    };
}

export const remoteProcessingAttemptRepository = createSqliteRemoteProcessingAttemptRepository();
