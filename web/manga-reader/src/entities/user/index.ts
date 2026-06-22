// Types
export type {
    User,
    UserRole,
    AdultContentPreference,
    EnrichedProfile,
    ProfileStats,
    RecommendedTitle,
    ViewHistoryItem,
    CommentSummary,
    PrivacySettings,
    VisibilitySetting,
    SocialLinkResponse,
} from './model/user.types';
export type { ProfileData } from './model/profile-detail.types';

// Hooks
export { default as useUserProfile } from './model/useUserProfile';
export { default as useUserDetails } from './model/useUserDetails';
export { default as useEnrichedProfile } from './model/useEnrichedProfile';
export { default as useContentLocales } from './model/useContentLocales';
export { default as useUserSettings } from './model/useUserSettings';

// Context
export { UserModalProvider } from './model/UserModalContext';
export { useUserModalContext } from './model/useUserModalContext';
export { ProfileSettingsModalProvider, useProfileSettingsModal, type ProfileSettingsTab } from './model/ProfileSettingsModalContext';

// Services
export { recordView, updateProfile, type UpdateProfilePayload, getMySettings, updateMySettings, getFavoriteGenres, updateFavoriteGenres } from './api/userService';

// Settings
export {
    DEFAULT_USER_SETTINGS,
    type UserSettings,
    type ReadingDirection,
    type ReadingMode,
    type ReadingFit,
    type ImageQuality,
    type ReaderBackground,
    type ThemePreference,
    type FontSizePreference,
    type DensityPreference,
    type DateFormatPreference,
} from './model/userSettings.types';

// Utils
export { buildUserModalPayload } from './lib/buildUserModalPayload';
export {
    applyReduceMotion,
    applySystemPreferences,
    initAccessibilityFromStorage,
    mergeUserSettings,
    readStoredUserSettings,
    subscribeStoredUserSettings,
    updateStoredUserSettings,
    writeStoredUserSettings,
    SETTINGS_STORAGE_KEY,
    SETTINGS_STORAGE_EVENT,
} from './lib/accessibility';

// Components
export { default as UserModal } from './ui/UserModal';
export { default as UserModalHeader } from './ui/UserModalHeader';
export { default as UserModalBody } from './ui/UserModalBody';

// Components — Profile sections
export { default as ProfileBanner } from './ui/profile/ProfileBanner';
export { default as ProfileHeader } from './ui/profile/ProfileHeader';
export { default as ProfileStatsSection } from './ui/profile/ProfileStats';
export { default as ProfileTabs } from './ui/profile/ProfileTabs';
export { default as ProfileSkeleton } from './ui/profile/ProfileSkeleton';
export { default as ProfileEmptyState } from './ui/profile/ProfileEmptyState';
export { default as ProfileEditModal } from './ui/profile/ProfileEditModal';
export { default as RecommendationsSection } from './ui/profile/RecommendationsSection';
export { default as ProfileCommentsSection } from './ui/profile/ProfileCommentsSection';
export { default as ViewHistorySection } from './ui/profile/ViewHistorySection';
export { default as PrivacySettingsForm } from './ui/profile/PrivacySettingsForm';
