import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    SubscriptionGrowthChart,
    SubscriptionSummaryCards,
    useAdminSubscriptionActions,
    useAdminSubscriptions,
    useAdminSubscriptionSummary,
    useAdminPlans,
    useAdminPlanActions,
    useSubscriptionGrowth,
    grantSubscription,
    revokeSubscription,
    type AdminSubscription,
    type AdminPlan,
} from '@features/admin';
import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';
import type { LocalizedString, LocalizedStringList } from '@shared/type/i18n';

import SubscriptionsTab from './parts/SubscriptionsTab';
import PlansTab from './parts/PlansTab';
import AuditLogTab from './parts/AuditLogTab';

type Tab = 'subscriptions' | 'plans' | 'logs';

const DashboardSubscriptions = () => {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState<Tab>('subscriptions');

    const tabs: { key: Tab; label: string }[] = [
        {
            key: 'subscriptions',
            label: t('dashboard.subscriptions.tabs.subscriptions'),
        },
        { key: 'plans', label: t('dashboard.subscriptions.tabs.plans') },
        { key: 'logs', label: t('dashboard.subscriptions.tabs.logs') },
    ];

    // ── Subscriptions ──────────────────────────────
    const {
        subscriptions,
        page,
        totalPages,
        totalElements,
        isLoading,
        statusFilter,
        setStatusFilter,
        setPage,
        refetch: refetchSubscriptions,
    } = useAdminSubscriptions();

    const { summary, isLoading: isLoadingSummary, isError: isErrorSummary } = useAdminSubscriptionSummary();

    const { isSubmitting, handleUpdateStatus } = useAdminSubscriptionActions();

    const { data: growthData, isLoading: isLoadingGrowth } = useSubscriptionGrowth(12);

    const [editingSubscription, setEditingSubscription] = useState<AdminSubscription | null>(null);
    const [deletingSubscription, setDeletingSubscription] = useState<AdminSubscription | null>(null);
    const [isGrantOpen, setIsGrantOpen] = useState(false);
    const [isGrantSubmitting, setIsGrantSubmitting] = useState(false);
    const [selectedLogSubId, setSelectedLogSubId] = useState<string | null>(null);

    const confirmUpdate = async (status: string) => {
        if (editingSubscription) {
            await handleUpdateStatus(editingSubscription.id, status);
            setEditingSubscription(null);
        }
    };

    const handleGrant = async (userId: string, planId: string) => {
        setIsGrantSubmitting(true);
        try {
            await grantSubscription({ userId, planId });
            showSuccessToast(t('dashboard.subscriptions.grantSuccess'));
            setIsGrantOpen(false);
            refetchSubscriptions();
        } catch {
            showErrorToast(t('dashboard.subscriptions.grantError'));
        } finally {
            setIsGrantSubmitting(false);
        }
    };

    const handleRevoke = async () => {
        if (!deletingSubscription) return;
        try {
            await revokeSubscription(deletingSubscription.id);
            showSuccessToast(t('dashboard.subscriptions.revokeSuccess'));
            setDeletingSubscription(null);
            refetchSubscriptions();
        } catch {
            showErrorToast(t('dashboard.subscriptions.revokeError'));
        }
    };

    // ── Plans ──────────────────────────────────────
    const { plans, page: planPage, totalPages: planTotalPages, isLoading: isLoadingPlans, setPage: setPlanPage } = useAdminPlans();

    const { isSubmitting: isPlanSubmitting, handleCreate: handleCreatePlan, handleUpdate: handleUpdatePlan } = useAdminPlanActions();

    const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
    const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);

    const handlePlanSubmit = async (data: {
        period?: string;
        priceInCents: number;
        description: LocalizedString;
        features: LocalizedStringList;
        active?: boolean;
        prices: Record<string, number>;
    }) => {
        if (editingPlan) {
            await handleUpdatePlan(editingPlan.id, {
                priceInCents: data.priceInCents,
                description: data.description,
                features: data.features,
                active: data.active,
                prices: data.prices,
            });
        } else {
            await handleCreatePlan({
                period: data.period!,
                priceInCents: data.priceInCents,
                description: data.description,
                features: data.features,
                prices: data.prices,
            });
        }
        setIsPlanFormOpen(false);
        setEditingPlan(null);
    };

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-lg font-bold">{t('dashboard.subscriptions.title')}</h1>

            {isLoadingSummary ? (
                <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xs bg-tertiary/30 animate-pulse" />
                    ))}
                </div>
            ) : isErrorSummary || !summary ? (
                <p className="text-sm text-tertiary">{t('dashboard.subscriptions.errorSummary')}</p>
            ) : (
                <SubscriptionSummaryCards summary={summary} />
            )}

            {isLoadingGrowth ? (
                <div className="h-64 rounded-xs bg-tertiary/30 animate-pulse" />
            ) : growthData ? (
                <SubscriptionGrowthChart entries={growthData.entries} />
            ) : null}

            <div className="flex gap-1 overflow-x-auto border-b border-b-tertiary">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === tab.key ? 'border-b-2 border-quaternary-default text-quaternary-default' : 'text-tertiary hover:text-primary'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'subscriptions' && (
                <SubscriptionsTab
                    subscriptions={subscriptions}
                    page={page}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    isLoading={isLoading}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    setPage={setPage}
                    editingSubscription={editingSubscription}
                    setEditingSubscription={setEditingSubscription}
                    deletingSubscription={deletingSubscription}
                    setDeletingSubscription={setDeletingSubscription}
                    isGrantOpen={isGrantOpen}
                    setIsGrantOpen={setIsGrantOpen}
                    isGrantSubmitting={isGrantSubmitting}
                    isSubmitting={isSubmitting}
                    confirmUpdate={confirmUpdate}
                    handleGrant={handleGrant}
                    handleRevoke={handleRevoke}
                />
            )}

            {activeTab === 'plans' && (
                <PlansTab
                    plans={plans}
                    planPage={planPage}
                    planTotalPages={planTotalPages}
                    isLoadingPlans={isLoadingPlans}
                    setPlanPage={setPlanPage}
                    editingPlan={editingPlan}
                    setEditingPlan={setEditingPlan}
                    isPlanFormOpen={isPlanFormOpen}
                    setIsPlanFormOpen={setIsPlanFormOpen}
                    isPlanSubmitting={isPlanSubmitting}
                    handlePlanSubmit={handlePlanSubmit}
                />
            )}

            {activeTab === 'logs' && <AuditLogTab selectedLogSubId={selectedLogSubId} setSelectedLogSubId={setSelectedLogSubId} />}
        </div>
    );
};

export default DashboardSubscriptions;
