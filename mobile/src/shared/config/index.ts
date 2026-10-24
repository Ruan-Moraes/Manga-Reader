export { type AppMetadata, appMetadata, type ExpoMetadataSource, readAppMetadata } from './appMetadata';
export {
    type ExpoExternalLinksSource,
    EXTERNAL_LINK_KEYS,
    ExternalLinkError,
    type ExternalLinkKey,
    type ExternalLinks,
    externalLinks,
    normalizeHttpsUrl,
    openConfiguredHttpsUrl,
    readConfiguredExternalLinks,
} from './externalLinks';
