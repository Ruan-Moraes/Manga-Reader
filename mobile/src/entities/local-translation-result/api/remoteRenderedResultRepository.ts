import { type AppDatabase, openAppDatabase } from '@/shared/storage';

import { parseRenderedTranslationManifest, type RenderedTranslationManifest } from '../model/renderedTranslationManifest';
import { localTranslationResultRepository } from './localTranslationResultRepository';

export interface RemoteRenderedResultInsert {
    projectId: string;
    pageId: string;
    attemptId: string;
    manifest: RenderedTranslationManifest;
    renderedFilename: string;
    readyAt: number;
    signal?: AbortSignal;
}
export interface RemoteRenderedResultRepository {
    commit(input: RemoteRenderedResultInsert): Promise<boolean>;
    claimAutoOpen(pageId: string, now: number): Promise<boolean>;
}
export function createRemoteRenderedResultRepository(
    database: () => Promise<AppDatabase> = openAppDatabase,
    initialize: () => Promise<void> = () => localTranslationResultRepository.initialize(),
): RemoteRenderedResultRepository {
    return {
        async commit(command) {
            try {
                // Snapshot the validated contract before the first await.
                const input = {
                    ...command,
                    manifest: parseRenderedTranslationManifest(new TextEncoder().encode(JSON.stringify(command.manifest)), {
                        ...command.manifest,
                        image: command.manifest.image,
                    }),
                };
                const active = () => {
                    if (input.signal?.aborted) throw new Error();
                };
                active();
                if (!/^[a-zA-Z0-9_-]+$/.test(input.renderedFilename) || !Number.isSafeInteger(input.readyAt) || input.readyAt <= 0) throw new Error();
                await initialize();
                active();
                const db = await database();
                active();
                let inserted = false;
                await db.withExclusiveTransactionAsync(async tx => {
                    active();
                    if ((await tx.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys'))?.foreign_keys !== 1) throw new Error();
                    const parent = await tx.getFirstAsync<{
                        remote_job_ref: string;
                        status: string;
                        remote_status: string;
                        gateway_contract_version: string;
                        volatile_receipt_status: string | null;
                        page_status: string;
                        project_status: string;
                        source_language: string;
                        target_language: string;
                        width_px: number;
                        height_px: number;
                    }>(
                        `SELECT a.remote_job_ref,a.status,a.remote_status,a.gateway_contract_version,a.volatile_receipt_status,p.status AS page_status,pr.status AS project_status,pr.source_language,pr.target_language,p.width_px,p.height_px
                         FROM remote_processing_attempts a JOIN translation_pages p ON p.id=a.page_id JOIN translation_projects pr ON pr.id=p.project_id
                         WHERE a.id=? AND p.id=? AND pr.id=?`,
                        [input.attemptId, input.pageId, input.projectId],
                    );
                    const m = input.manifest;
                    active();
                    if (
                        !parent ||
                        parent.status !== 'ACCEPTED' ||
                        parent.remote_status !== 'READY' ||
                        parent.gateway_contract_version !== '2.0' ||
                        parent.volatile_receipt_status !== 'FINISHED' ||
                        parent.remote_job_ref !== m.jobRef ||
                        parent.source_language !== m.sourceLanguage ||
                        parent.target_language !== m.targetLanguage ||
                        parent.width_px !== m.image.widthPx ||
                        parent.height_px !== m.image.heightPx ||
                        !['QUEUED', 'PROCESSING', 'READY'].includes(parent.page_status) ||
                        !['QUEUED', 'PROCESSING', 'READY'].includes(parent.project_status)
                    )
                        throw new Error();
                    const existing = await tx.getFirstAsync<{ attempt_id: string; sha256: string }>(
                        'SELECT attempt_id,sha256 FROM translation_page_results WHERE page_id=?',
                        [input.pageId],
                    );
                    active();
                    if (existing) {
                        if (existing.attempt_id !== input.attemptId || existing.sha256 !== m.image.sha256) throw new Error();
                        return;
                    }
                    await tx.runAsync(
                        `INSERT INTO translation_page_results(page_id,attempt_id,source_kind,rendered_filename,mime_type,byte_size,width_px,height_px,sha256,ready_at,auto_opened_at)
                        VALUES (?,?,'REMOTE',?,?,?,?,?,?,?,NULL)`,
                        [
                            input.pageId,
                            input.attemptId,
                            input.renderedFilename,
                            m.image.mimeType,
                            m.image.byteSize,
                            m.image.widthPx,
                            m.image.heightPx,
                            m.image.sha256,
                            input.readyAt,
                        ],
                    );
                    for (const r of m.regions) {
                        active();
                        await tx.runAsync(
                            `INSERT INTO text_regions(id,page_id,reading_order,source_text,translated_text,translation_contract_version,translation_model,translated_at,overflow,created_at)
                            VALUES (?,?,?,?,?,NULL,NULL,NULL,?,?)`,
                            [r.id, input.pageId, r.readingOrder, r.sourceText, r.translatedText, r.overflow ? 1 : 0, input.readyAt],
                        );
                        for (const [index, v] of r.polygon.entries()) {
                            active();
                            await tx.runAsync('INSERT INTO text_region_vertices(region_id,vertex_index,x,y) VALUES (?,?,?,?)', [r.id, index, v.x, v.y]);
                        }
                    }
                    // MOB-FEAT-023: the chapter names this page used join the project's glossary; a name the project
                    // already decided keeps its first translation.
                    for (const term of m.terms ?? []) {
                        active();
                        await tx.runAsync(
                            'INSERT INTO translation_project_terms(project_id,source_term,target_term,created_at) VALUES (?,?,?,?) ON CONFLICT DO NOTHING',
                            [input.projectId, term.source, term.target, input.readyAt],
                        );
                    }
                    active();
                    await tx.runAsync("UPDATE translation_pages SET status='READY',updated_at=?,status_updated_at=? WHERE id=?", [
                        input.readyAt,
                        input.readyAt,
                        input.pageId,
                    ]);
                    await tx.runAsync(
                        `UPDATE translation_projects SET status=CASE WHEN EXISTS(SELECT 1 FROM translation_pages WHERE project_id=? AND status<>'READY') THEN 'PROCESSING' ELSE 'READY' END,updated_at=?,status_updated_at=? WHERE id=?`,
                        [input.projectId, input.readyAt, input.readyAt, input.projectId],
                    );
                    active();
                    inserted = true;
                });
                return inserted;
            } catch {
                throw new Error('localTranslation.storageUnavailable');
            }
        },
        async claimAutoOpen(pageId, now) {
            await initialize();
            const db = await database();
            let claimed = false;
            await db.withExclusiveTransactionAsync(async tx => {
                const result = await tx.getFirstAsync<{ auto_opened_at: number | null; ready_at: number }>(
                    "SELECT r.auto_opened_at,r.ready_at FROM translation_page_results r JOIN translation_pages p ON p.id=r.page_id WHERE r.page_id=? AND r.source_kind='REMOTE' AND p.status='READY'",
                    [pageId],
                );
                if (!result || result.auto_opened_at !== null || !Number.isSafeInteger(now) || now < result.ready_at) return;
                await tx.runAsync('UPDATE translation_page_results SET auto_opened_at=? WHERE page_id=? AND auto_opened_at IS NULL', [now, pageId]);
                claimed = true;
            });
            return claimed;
        },
    };
}
export const remoteRenderedResultRepository = createRemoteRenderedResultRepository();
