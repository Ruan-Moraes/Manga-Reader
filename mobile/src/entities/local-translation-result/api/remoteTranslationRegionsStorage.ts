import { z } from 'zod';

import type { SqlExecutor } from '@/shared/storage';

import { buildLocalTranslatedRegions, type LocalTranslationRegionExpectation, parseLocalTranslationManifest } from '../model/localTranslationManifest';

export interface RemoteTranslationRegionsInsert {
    pageId: string;
    attemptId: string;
    manifest: unknown;
    expected: LocalTranslationRegionExpectation;
    acquiredAt: number;
    overflow: readonly { regionId: string; overflow: boolean }[];
}

const REGIONS_PER_BATCH = 64;
const VERTICES_PER_BATCH = 200;

async function insertBatches(transaction: SqlExecutor, prefix: string, rows: readonly (readonly (string | number)[])[], batchSize: number): Promise<void> {
    for (let offset = 0; offset < rows.length; offset += batchSize) {
        const batch = rows.slice(offset, offset + batchSize);
        const placeholders = batch.map(row => `(${row.map(() => '?').join(', ')})`).join(', ');
        await transaction.runAsync(`${prefix} VALUES ${placeholders}`, batch.flat());
    }
}

const insertSchema = z
    .object({
        pageId: z.uuid(),
        attemptId: z.uuid(),
        manifest: z.unknown(),
        expected: z.unknown(),
        acquiredAt: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
        overflow: z.array(z.object({ regionId: z.uuid(), overflow: z.boolean() }).strict()).max(1024),
    })
    .strict();

function invalidInsert(): Error {
    return new Error('localTranslation.invalidRemoteManifest');
}

/**
 * Inserts only region data inside the caller's exclusive acquisition transaction.
 * The caller owns verified files and the result parent; this never promotes READY or ACKs.
 */
export async function insertRemoteTranslationRegions(transaction: SqlExecutor, command: RemoteTranslationRegionsInsert): Promise<void> {
    try {
        const input = insertSchema.parse(command);
        const expected = input.expected as LocalTranslationRegionExpectation;
        const manifest = parseLocalTranslationManifest(input.manifest, {
            jobRef: expected.jobRef,
            sourceLanguage: expected.sourceLanguage,
            targetLanguage: expected.targetLanguage,
            ocrManifestSha256: expected.ocrManifestSha256,
            regions: expected.regions.map(region => ({ id: region.id, readingOrder: region.readingOrder })),
        });
        const regions = buildLocalTranslatedRegions(manifest, expected, input.acquiredAt);
        const overflowById = new Map(input.overflow.map(flag => [flag.regionId, flag.overflow]));
        if (input.overflow.length !== regions.length || overflowById.size !== regions.length || regions.some(region => !overflowById.has(region.id))) {
            throw invalidInsert();
        }

        // Validation and snapshots precede I/O; caller mutations cannot change the write.
        const foreignKeys = await transaction.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys', []);
        if (foreignKeys?.foreign_keys !== 1) throw invalidInsert();
        const parent = await transaction.getFirstAsync<{
            remote_job_ref: string;
            source_language: string;
            target_language: string;
            ready_at: number;
        }>(
            `SELECT a.remote_job_ref, pr.source_language, pr.target_language, r.ready_at
             FROM translation_page_results r
             JOIN remote_processing_attempts a ON a.id = r.attempt_id AND a.page_id = r.page_id
             JOIN translation_pages p ON p.id = r.page_id
             JOIN translation_projects pr ON pr.id = p.project_id
             WHERE r.page_id = ? AND r.attempt_id = ? AND r.source_kind = 'REMOTE'
               AND a.status = 'ACCEPTED' AND a.remote_status = 'READY'`,
            [input.pageId, input.attemptId],
        );
        if (
            !parent ||
            parent.remote_job_ref !== manifest.jobRef ||
            parent.source_language !== manifest.sourceLanguage ||
            parent.target_language !== manifest.targetLanguage ||
            parent.ready_at > input.acquiredAt
        )
            throw invalidInsert();

        const existing = await transaction.getFirstAsync<{ id: string }>('SELECT id FROM text_regions WHERE page_id = ? LIMIT 1', [input.pageId]);
        if (existing) throw invalidInsert();

        // Bound both native round trips and bind parameters (at most 800 per statement).
        await insertBatches(
            transaction,
            `INSERT INTO text_regions (id, page_id, reading_order, source_text, translated_text,
                translation_contract_version, translation_model, translated_at, overflow, created_at)`,
            regions.map(region => [
                region.id,
                input.pageId,
                region.readingOrder,
                region.sourceText,
                region.translatedText,
                region.translationMetadata.contractVersion,
                region.translationMetadata.model,
                region.translationMetadata.translatedAt,
                overflowById.get(region.id)! ? 1 : 0,
                input.acquiredAt,
            ]),
            REGIONS_PER_BATCH,
        );
        await insertBatches(
            transaction,
            'INSERT INTO text_region_vertices (region_id, vertex_index, x, y)',
            regions.flatMap(region => region.vertices.map(vertex => [region.id, vertex.index, vertex.x, vertex.y])),
            VERTICES_PER_BATCH,
        );
    } catch {
        // Native SQL errors may embed identifiers/content. Throw without a raw cause.
        throw invalidInsert();
    }
}
