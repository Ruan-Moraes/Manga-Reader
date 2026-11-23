export { applyAdultContentPolicy, type SensitiveContentPresentation } from './lib/adultContentPolicy';
export {
    ADULT_CONTENT_OPTIONS,
    type AdultContentPreference,
    COMMENT_VISIBILITY_OPTIONS,
    HISTORY_VISIBILITY_OPTIONS,
    type HistoryVisibility,
    InvalidPrivacySettingsError,
    LIBRARY_VISIBILITY_OPTIONS,
    normalizePrivacySettings,
    type PrivacyPatch,
    type PrivacySettings,
    type PublicVisibility,
    validatePrivacyPatch,
} from './model/privacy';
export { usePrivacySettingsStore } from './model/privacyStore';
export type { User, UserRole } from './model/user';
export { SensitiveContentGuard } from './ui/SensitiveContentGuard';
