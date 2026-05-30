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

// Hooks
export { default as useUserProfile } from './model/useUserProfile';
export { default as useUserDetails } from './model/useUserDetails';
export { default as useEnrichedProfile } from './model/useEnrichedProfile';
export { default as useContentLocales } from './model/useContentLocales';

// Context
export { UserModalProvider } from './model/UserModalContext';
export { useUserModalContext } from './model/useUserModalContext';

// Services
export { recordView, updateProfile, type UpdateProfilePayload } from './api/userService';

// Utils
export { buildUserModalPayload } from './lib/buildUserModalPayload';

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
export { default as CommentsSection } from './ui/profile/CommentsSection';
export { default as ViewHistorySection } from './ui/profile/ViewHistorySection';
export { default as PrivacySettingsForm } from './ui/profile/PrivacySettingsForm';
