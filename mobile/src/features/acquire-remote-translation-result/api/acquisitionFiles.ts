import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';

import { type RenderedTranslationManifest, TRANSLATION_RESULT_NAMESPACE } from '@/entities/local-translation-result';
import { TRANSLATION_PROJECT_NAMESPACE, type TranslationProject } from '@/entities/translation-project';
import { appPrivateBatchFiles, sha256Bytes, sha256File } from '@/shared/files';
import { randomUuid } from '@/shared/lib';
import { parseImageStructure } from '@/shared/media-inspection';

export interface AcquisitionStage {
    renderedFilename: string;
    promote(): Promise<void>;
    validate(): Promise<void>;
    discard(): Promise<void>;
    finish(): Promise<void>;
}
export async function stageAcquisition(
    projectId: string,
    manifest: RenderedTranslationManifest,
    imageBytes: Uint8Array<ArrayBuffer>,
    manifestBytes: Uint8Array<ArrayBuffer>,
): Promise<AcquisitionStage> {
    const id = randomUuid(),
        name = `remote_${id}`,
        manifestName = `${name}_manifest`;
    const cache = new Directory(Paths.cache, `acquire_${id}`);
    let promoted = false;
    const clean = async () => {
        await appPrivateBatchFiles.discardStaging(TRANSLATION_RESULT_NAMESPACE, id);
        if (cache.exists) cache.delete();
    };
    try {
        const parsed = parseImageStructure(imageBytes.subarray(0, 262144), imageBytes.subarray(Math.max(0, imageBytes.length - 4096)), imageBytes.length);
        if (
            !parsed ||
            parsed.mimeType !== 'image/webp' ||
            parsed.animated ||
            parsed.width !== manifest.image.widthPx ||
            parsed.height !== manifest.image.heightPx
        )
            throw new Error();
        cache.create({ intermediates: true });
        const image = new File(cache, 'image');
        image.create();
        image.write(imageBytes);
        const metadata = new File(cache, 'manifest');
        metadata.create();
        metadata.write(manifestBytes);
        await appPrivateBatchFiles.stageBatch(TRANSLATION_RESULT_NAMESPACE, id, [
            { sourceUri: image.uri, filename: name },
            { sourceUri: metadata.uri, filename: manifestName },
        ]);
        const metadataHash = await sha256Bytes(manifestBytes);
        return {
            renderedFilename: name,
            async promote() {
                promoted = true;
                await appPrivateBatchFiles.promoteStagedFiles(TRANSLATION_RESULT_NAMESPACE, id, projectId, [name, manifestName]);
            },
            async validate() {
                const uri = appPrivateBatchFiles.fileUri(TRANSLATION_RESULT_NAMESPACE, projectId, name);
                if (
                    (await sha256File(uri)) !== manifest.image.sha256 ||
                    (await sha256File(appPrivateBatchFiles.fileUri(TRANSLATION_RESULT_NAMESPACE, projectId, manifestName))) !== metadataHash
                )
                    throw new Error('localTranslation.invalidRemoteManifest');
                const decoded = await Image.loadAsync({ uri }, { maxWidth: 2048, maxHeight: 2048 });
                decoded.release();
            },
            async discard() {
                if (promoted) {
                    await appPrivateBatchFiles.removeFile(TRANSLATION_RESULT_NAMESPACE, projectId, name);
                    await appPrivateBatchFiles.removeFile(TRANSLATION_RESULT_NAMESPACE, projectId, manifestName);
                }
                await clean();
            },
            finish: clean,
        };
    } catch {
        await clean();
        throw new Error('localTranslation.storageUnavailable');
    }
}
export async function originalPageHash(project: TranslationProject, pageId: string): Promise<string> {
    const page = project.pages.find(p => p.id === pageId);
    if (!page) throw new Error('localTranslation.storageUnavailable');
    return sha256File(appPrivateBatchFiles.fileUri(TRANSLATION_PROJECT_NAMESPACE, project.id, page.originalFilename));
}
export async function validateAcquiredFile(projectId: string, filename: string, hash: string): Promise<boolean> {
    return (
        (await appPrivateBatchFiles.fileExists(TRANSLATION_RESULT_NAMESPACE, projectId, filename)) &&
        (await sha256File(appPrivateBatchFiles.fileUri(TRANSLATION_RESULT_NAMESPACE, projectId, filename))) === hash
    );
}
