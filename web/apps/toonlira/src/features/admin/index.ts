// Types
export type {
    AdminUser,
    DashboardMetrics,
    BanUserRequest,
    ChangeRoleRequest,
    AdminTitle,
    CreateTitleRequest,
    UpdateTitleRequest,
    AdminNews,
    CreateNewsRequest,
    UpdateNewsRequest,
    AdminEvent,
    CreateEventRequest,
    UpdateEventRequest,
    AdminGroup,
    GroupMember,
    ChangeGroupMemberRoleRequest,
    TopTitle,
    ContentMetrics,
    AdminPayment,
    UpdatePaymentStatusRequest,
    FinancialSummary,
    AdminSubscription,
    SubscriptionSummary,
    UpdateSubscriptionStatusRequest,
    AdminTag,
    CreateTagRequest,
    UpdateTagRequest,
    AdminAuthor,
    CreateAuthorRequest,
    UpdateAuthorRequest,
    AdminPublisher,
    CreatePublisherRequest,
    UpdatePublisherRequest,
    AdminPlan,
    AdminStore,
    StoreRequest,
    CreatePlanRequest,
    UpdatePlanRequest,
    GrantSubscriptionRequest,
    SubscriptionAuditLogEntry,
    MonthlyRevenueEntry,
    RevenueTimeSeries,
    MonthlyGrowthEntry,
    SubscriptionGrowth,
} from './model/admin.types';

// Hooks — Users
export { default as useAdminUsers } from './model/useAdminUsers';
export { default as useAdminUserDetail } from './model/useAdminUserDetail';
export { default as useAdminUserActions } from './model/useAdminUserActions';
export { default as useDashboardMetrics } from './model/useDashboardMetrics';

// Hooks — Titles
export { default as useAdminTitles } from './model/useAdminTitles';
export { default as useAdminTitleActions } from './model/useAdminTitleActions';
export { default as useAdminStores } from './model/useAdminStores';
export { default as useAdminStoreActions } from './model/useAdminStoreActions';

// Status helpers (tones/labels compartilhados com as páginas do dashboard)
export { CHAPTER_STATUS_TONE, TITLE_STATUS_TONE, statusLabelKey, toneFor } from './model/statusTone';

// Hooks — Chapters
export { default as useAdminChapters, type ChapterListFilters } from './model/useAdminChapters';
export { default as useAdminChapterActions } from './model/useAdminChapterActions';
export { default as useAdminChapterDetail } from './model/useAdminChapterDetail';
export { default as useAdminChapterPagesActions } from './model/useAdminChapterPagesActions';
export { default as useChapterFormModalState } from './model/useChapterFormModalState';
export { default as useChapterSelection } from './model/useChapterSelection';
export { default as useChapterAnalytics } from './model/useChapterAnalytics';

// Hooks — News
export { default as useAdminNews } from './model/useAdminNews';
export { default as useAdminNewsActions } from './model/useAdminNewsActions';

// Hooks — Events
export { default as useAdminEvents } from './model/useAdminEvents';
export { default as useAdminEventActions } from './model/useAdminEventActions';

// Hooks — Groups
export { default as useAdminGroups } from './model/useAdminGroups';
export { default as useAdminGroupDetail } from './model/useAdminGroupDetail';
export { default as useAdminGroupActions } from './model/useAdminGroupActions';

// Hooks — Dashboard Content Metrics
export { default as useContentMetrics } from './model/useContentMetrics';

// Hooks — Payments
export { default as useAdminPayments } from './model/useAdminPayments';
export { default as useAdminPaymentActions } from './model/useAdminPaymentActions';
export { default as useFinancialSummary } from './model/useFinancialSummary';

// Hooks — Subscriptions
export { default as useAdminSubscriptions } from './model/useAdminSubscriptions';
export { default as useAdminSubscriptionActions } from './model/useAdminSubscriptionActions';
export { default as useAdminSubscriptionSummary } from './model/useAdminSubscriptionSummary';

// Hooks — Tags
export { default as useAdminTags } from './model/useAdminTags';
export { default as useAdminTagActions } from './model/useAdminTagActions';
export { default as useAdminAuthors } from './model/useAdminAuthors';
export { default as useAdminAuthorActions } from './model/useAdminAuthorActions';
export { default as useAdminPublishers } from './model/useAdminPublishers';
export { default as useAdminPublisherActions } from './model/useAdminPublisherActions';

// Hooks — Plans
export { default as useAdminPlans } from './model/useAdminPlans';
export { default as useAdminPlanActions } from './model/useAdminPlanActions';

// Hooks — Charts
export { default as useRevenueSeries } from './model/useRevenueSeries';
export { default as useSubscriptionGrowth } from './model/useSubscriptionGrowth';

// Components
export { default as AdminDashboardOverview } from './ui/AdminDashboardOverview';
export { default as AdminUserList } from './ui/AdminUserList';
export { default as AdminUserDetail } from './ui/AdminUserDetail';
export { default as AdminTitleList } from './ui/AdminTitleList';
export { default as AdminStoreList } from './ui/AdminStoreList';
export { default as AdminChapterList } from './ui/AdminChapterList';
export { default as ChapterPageGrid } from './ui/parts/ChapterPageGrid';
export { default as ChapterMetricsPanel } from './ui/parts/ChapterMetricsPanel';
export { default as ChapterMetricsFilters } from './ui/parts/ChapterMetricsFilters';
export { default as AdminNewsList } from './ui/AdminNewsList';
export { default as AdminEventList } from './ui/AdminEventList';
export { default as AdminGroupList } from './ui/AdminGroupList';
export { default as AdminGroupDetail } from './ui/AdminGroupDetail';
export { default as MetricsCard } from './ui/MetricsCard';
export { default as ContentMetricsPanel } from './ui/ContentMetricsPanel';
export { default as AdminPaymentList } from './ui/AdminPaymentList';
export { default as FinancialDashboard } from './ui/FinancialDashboard';
export { default as BanUserModal } from './ui/modal/BanUserModal';
export { default as ChangeRoleModal } from './ui/modal/ChangeRoleModal';
export { default as ChangeGroupRoleModal } from './ui/modal/ChangeGroupRoleModal';
export { default as GroupFormModal, type GroupFormSubmitPayload } from './ui/modal/GroupFormModal';
export { default as AdminGroupDetailModal } from './ui/modal/AdminGroupDetailModal';
export { default as UpdatePaymentStatusModal } from './ui/modal/UpdatePaymentStatusModal';
export { default as ConfirmDeleteWithIdModal } from './ui/modal/ConfirmDeleteWithIdModal';
export { default as ConfirmModal } from './ui/modal/ConfirmModal';
export { default as AdminUserDetailModal } from './ui/modal/AdminUserDetailModal';
export { default as TitleFormModal } from './ui/modal/TitleFormModal';
export { default as StoreFormModal } from './ui/modal/StoreFormModal';
export { default as ChapterFormModal } from './ui/modal/ChapterFormModal';
export { default as ReorderChaptersModal } from './ui/modal/ReorderChaptersModal';
export { default as BulkChapterStatusModal } from './ui/modal/BulkChapterStatusModal';
export { default as NewsFormModal } from './ui/modal/NewsFormModal';
export { default as EventFormModal } from './ui/modal/EventFormModal';

// Components — Charts
export { default as RevenueChart } from './ui/chart/RevenueChart';
export { default as RevenueKPICards } from './ui/chart/RevenueKPICards';
export { default as SubscriptionGrowthChart } from './ui/chart/SubscriptionGrowthChart';

// Services
export { getAdminTitleDetail } from './api/adminTitleService';
export { getAdminGroupDetail } from './api/adminGroupService';
export { getAdminNewsDetail } from './api/adminNewsService';
export { getAdminEventDetail } from './api/adminEventService';
export { grantSubscription, revokeSubscription } from './api/adminSubscriptionService';

// Components — Subscriptions
export { default as AdminSubscriptionList } from './ui/AdminSubscriptionList';
export { default as SubscriptionSummaryCards } from './ui/SubscriptionSummaryCards';
export { default as UpdateSubscriptionStatusModal } from './ui/modal/UpdateSubscriptionStatusModal';

// Components — Tags
export { default as AdminTagList } from './ui/AdminTagList';
export { default as TagFormModal } from './ui/modal/TagFormModal';
export { default as AdminAuthorList } from './ui/AdminAuthorList';
export { default as AuthorFormModal } from './ui/modal/AuthorFormModal';
export { default as AdminPublisherList } from './ui/AdminPublisherList';
export { default as PublisherFormModal } from './ui/modal/PublisherFormModal';

// Components — Plans & Subscription extras
export { default as AdminPlanList } from './ui/AdminPlanList';
export { default as PlanFormModal } from './ui/modal/PlanFormModal';
export { default as GrantSubscriptionModal } from './ui/modal/GrantSubscriptionModal';
export { default as SubscriptionAuditLog } from './ui/SubscriptionAuditLog';
