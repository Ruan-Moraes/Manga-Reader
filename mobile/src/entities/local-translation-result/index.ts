export {
    CREATE_LOCAL_TRANSLATION_SCHEMA,
    createSqliteLocalTranslationResultRepository,
    type LocalTranslationLibraryItem,
    type LocalTranslationResultRepository,
    localTranslationResultRepository,
    registerLocalTranslationResultDataParticipant,
    TRANSLATION_RESULT_NAMESPACE,
} from './api/localTranslationResultRepository';
export { insertRemoteTranslationRegions, type RemoteTranslationRegionsInsert } from './api/remoteTranslationRegionsStorage';
export {
    buildLocalTranslatedRegions,
    type LocalTranslatedRegion,
    type LocalTranslationManifest,
    type LocalTranslationManifestExpectation,
    type LocalTranslationRegionExpectation,
    parseLocalTranslationManifest,
    parseLocalTranslationManifestBytes,
} from './model/localTranslationManifest';
export {
    isLocalResultSource,
    LOCAL_RESULT_SOURCES,
    type LocalResultSource,
    type LocalTranslationResult,
    type NewLocalTranslationResult,
    type TextRegion,
    type TextRegionVertex,
    type TranslationMetadata,
} from './model/localTranslationResult';
