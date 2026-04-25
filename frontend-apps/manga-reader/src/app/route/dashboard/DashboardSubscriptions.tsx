import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import AdminSubscriptionList from '@feature/admin/component/AdminSubscriptionList';
import AdminPlanList from '@feature/admin/component/AdminPlanList';
import SubscriptionGrowthChart from '@feature/admin/component/chart/SubscriptionGrowthChart';
import SubscriptionSummaryCards from '@feature/admin/component/SubscriptionSummaryCards';
import SubscriptionAuditLog from '@feature/admin/component/SubscriptionAuditLog';
import UpdateSubscriptionStatusModal from '@feature/admin/component/modal/UpdateSubscriptionStatusModal';
import PlanFormModal from '@feature/admin/component/modal/PlanFormModal';
import GrantSubscriptionModal from '@feature/admin/component/modal/GrantSubscriptionModal';
import useAdminSubscriptionActions from '@feature/admin/hook/useAdminSubscriptionActions';
import useAdminSubscriptions from '@feature/admin/hook/useAdminSubscriptions';
import useAdminSubscriptionSummary from '@feature/admin/hook/useAdminSubscriptionSummary';
import useAdminPlans from '@feature/admin/hook/useAdminPlans';
import useAdminPlanActions from '@feature/admin/hook/useAdminPlanActions';
import useSubscriptionGrowth from '@feature/admin/hook/useSubscriptionGrowth';
import type {
    AdminSubscription,
    AdminPlan,
} from '@feature/admin/type/admin.types';
import {
    grantSubscription,
    revokeSubscription,
} from '@feature/admin/service/adminSubscriptionService';
import {
    showErrorToast,
    showSuccessToast,
} from '@shared/service/util/toastService';

const STATUS_OPTIONS = ['', 'ACTIVE', 'EXPIRED', 'CANCELLED'] as const;

type Tab = 'subscriptions' | 'plans' | 'logs';

const DashboardSubscriptions = () => {
    const { t } = useTranslation('admin');
    const [activeTab, setActiveTab] = useState<Tab>('subscriptions');

    const statusLabels = useMemo<Record<string, string>>(
        () => ({
            '': t('dashboard.subscriptions.statusAll'),
            ACTIVE: t('dashboard.subscriptions.statusActive'),
            EXPIRED: t('dashboard.subscriptions.statusExpired'),
            CANCELLED: t('dashboard.subscriptions.statusCancelled'),
        }),
        [t],
    );

    const tabs = useMemo<{ key: Tab; label: string }[]>(
        () => [
            {
                key: 'subscriptions',
                label: t('dashboard.subscriptions.tabs.subscriptions'),
            },
            {
                key: 'plans',
                label: t('dashboard.subscriptions.tabs.plans'),
            },
            {
                key: 'logs',
                label: t('dashboard.subscriptions.tabs.logs'),
            },
        ],
        [t],
    );

    // ── Subscriptions state ────────────────────────
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

    const {
        summary,
        isLoading: isLoadingSummary,
        isError: isErrorSummary,
    } = useAdminSubscriptionSummary();

    const { isSubmitting, handleUpdateStatus } = useAdminSubscriptionActions();

    const { data: growthData, isLoading: isLoadingGrowth } =
        useSubscriptionGrowth(12);

    const [editingSubscription, setEditingSubscription] =
        useState<AdminSubscription | null>(null);
    const [isGrantOpen, setIsGrantOpen] = useState(false);
    const [isGrantSubmitting, setIsGrantSubmitting] = useState(false);
    const [selectedLogSubId, setSelectedLogSubId] = useState<string | null>(
        null,
    );

    const confirmUpdate = async (status: string) => {
        if (editingSubscription) {
            await handleUpdateStatus(editingSubscription.id, status);
            setEditingSubscription(null);
        }
    };

    const handleGrant = useCallback(
        async (userId: string, planId: string) => {
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
        },
        [refetchSubscriptions, t],
    );

    const handleRevoke = useCallback(
        async (sub: AdminSubscription) => {
            try {
                await revokeSubscription(sub.id);
                showSuccessToast(t('dashboard.subscriptions.revokeSuccess'));
                refetchSubscriptions();
            } catch {
                showErrorToast(t('dashboard.subscriptions.revokeError'));
            }
        },
        [refetchSubscriptions, t],
    );

    // ── Plans state ────────────────────────────────
    const {
        plans,
        page: planPage,
        totalPages: planTotalPages,
        isLoading: isLoadingPlans,
        setPage: setPlanPage,
    } = useAdminPlans();

    const {
        isSubmitting: isPlanSubmitting,
        handleCreate: handleCreatePlan,
        handleUpdate: handleUpdatePlan,
    } = useAdminPlanActions();

    const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
    const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);

    const handlePlanSubmit = async (data: {
        period?: string;
        priceInCents: number;
        description: string;
        features: string[];
        active?: boolean;
    }) => {
        if (editingPlan) {
            await handleUpdatePlan(editingPlan.id, {
                priceInCents: data.priceInCents,
                description: data.description,
                features: data.features,
                active: data.active,
            });
        } else {
            await handleCreatePlan({
                period: data.period!,
                priceInCents: data.priceInCents,
                description: data.description,
                features: data.features,
            });
        }
        setIsPlanFormOpen(false);
        setEditingPlan(null);
    };

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-lg font-bold">
                {t('dashboard.subscriptions.title')}
            </h1>

            {isLoadingSummary ? (
                <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-24 rounded-xs bg-tertiary/30 animate-pulse"
                        />
                    ))}
                </div>
            ) : isErrorSummary || !summary ? (
                <p className="text-sm text-tertiary">
                    {t('dashboard.subscriptions.errorSummary')}
                </p>
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
                            activeTab === tab.key
                                ? 'border-b-2 border-quaternary-default text-quaternary-default'
                                : 'text-tertiary hover:text-primary'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'subscriptions' && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-sm text-tertiary">
                                {t('dashboard.subscriptions.statusLabel')}
                            </label>
                            <select
                                value={statusFilter}
                                onChange={e => {
                                    setStatusFilter(e.target.value);
                                    setPage(0);
                                }}
                                className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                            >
                                {STATUS_OPTIONS.map(option => (
                                    <option
                                        key={option || 'all'}
                                        value={option}
                                    >
                                        {statusLabels[option] ?? option}
                                    </option>
                                ))}
                            </select>
                            <span className="text-sm text-tertiary">
                                {t('dashboard.subscriptions.count', {
                                    count: totalElements,
                                })}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsGrantOpen(true)}
                            className="px-3 py-2 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80"
                        >
                            {t('dashboard.subscriptions.grant')}
                        </button>
                    </div>

                    <AdminSubscriptionList
                        subscriptions={subscriptions}
                        page={page}
                        totalPages={totalPages}
                        isLoading={isLoading}
                        onPageChange={setPage}
                        onRowClick={sub => {
                            if (sub.status === 'ACTIVE') {
                                if (
                                    confirm(
                                        t(
                                            'dashboard.subscriptions.revokeConfirm',
                                        ),
                                    )
                                ) {
                                    handleRevoke(sub);
                                    return;
                                }
                            }
                            setEditingSubscription(sub);
                        }}
                    />

                    <UpdateSubscriptionStatusModal
                        isOpen={editingSubscription !== null}
                        onClose={() => setEditingSubscription(null)}
                        onConfirm={confirmUpdate}
                        subscriptionId={editingSubscription?.id ?? ''}
                        currentStatus={editingSubscription?.status ?? 'ACTIVE'}
                        isSubmitting={isSubmitting}
                    />

                    <GrantSubscriptionModal
                        isOpen={isGrantOpen}
                        onClose={() => setIsGrantOpen(false)}
                        onSubmit={handleGrant}
                        isSubmitting={isGrantSubmitting}
                    />
                </>
            )}

            {activeTab === 'plans' && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-tertiary">
                            {t('dashboard.subscriptions.plansManage')}
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingPlan(null);
                                setIsPlanFormOpen(true);
                            }}
                            className="px-3 py-2 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80"
                        >
                            {t('dashboard.subscriptions.planNew')}
                        </button>
                    </div>

                    <AdminPlanList
                        plans={plans}
                        page={planPage}
                        totalPages={planTotalPages}
                        isLoading={isLoadingPlans}
                        onPageChange={setPlanPage}
                        onEdit={plan => {
                            setEditingPlan(plan);
                            setIsPlanFormOpen(true);
                        }}
                    />

                    <PlanFormModal
                        isOpen={isPlanFormOpen}
                        onClose={() => {
                            setIsPlanFormOpen(false);
                            setEditingPlan(null);
                        }}
                        onSubmit={handlePlanSubmit}
                        plan={editingPlan}
                        isSubmitting={isPlanSubmitting}
                    />
                </>
            )}

            {activeTab === 'logs' && (
                <>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-tertiary">
                            {t('dashboard.subscriptions.logSubIdLabel')}
                        </label>
                        <input
                            type="text"
                            value={selectedLogSubId ?? ''}
                            onChange={e =>
                                setSelectedLogSubId(e.target.value || null)
                            }
                            placeholder={t(
                                'dashboard.subscriptions.logSubIdPlaceholder',
                            )}
                            className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                        />
                    </div>
                    <SubscriptionAuditLog subscriptionId={selectedLogSubId} />
                </>
            )}
        </div>
    );
};

export default DashboardSubscriptions;
