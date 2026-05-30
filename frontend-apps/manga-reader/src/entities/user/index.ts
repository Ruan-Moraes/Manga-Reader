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
} from './type/user.types';

// Hooks
export { default as useUserProfile } from './hook/useUserProfile';
export { default as useUserDetails } from './hook/useUserDetails';
export { default as useEnrichedProfile } from './hook/useEnrichedProfile';
export { default as useContentLocales } from './hook/useContentLocales';

// Context
export { UserModalProvider } from './context/UserModalContext';
export { useUserModalContext } from './context/useUserModalContext';

// Services
export { recordView, updateProfile, type UpdateProfilePayload } from './service/userService';

// Utils
export { buildUserModalPayload } from './util/buildUserModalPayload';

// Components
export { default as UserModal } from './component/UserModal';
export { default as UserModalHeader } from './component/UserModalHeader';
export { default as UserModalBody } from './component/UserModalBody';

// Components — Profile sections
export { default as ProfileBanner } from './component/profile/ProfileBanner';
export { default as ProfileHeader } from './component/profile/ProfileHeader';
export { default as ProfileStatsSection } from './component/profile/ProfileStats';
export { default as ProfileTabs } from './component/profile/ProfileTabs';
export { default as ProfileSkeleton } from './component/profile/ProfileSkeleton';
export { default as ProfileEmptyState } from './component/profile/ProfileEmptyState';
export { default as ProfileEditModal } from './component/profile/ProfileEditModal';
export { default as RecommendationsSection } from './component/profile/RecommendationsSection';
export { default as CommentsSection } from './component/profile/CommentsSection';
export { default as ViewHistorySection } from './component/profile/ViewHistorySection';
export { default as PrivacySettingsForm } from './component/profile/PrivacySettingsForm';
