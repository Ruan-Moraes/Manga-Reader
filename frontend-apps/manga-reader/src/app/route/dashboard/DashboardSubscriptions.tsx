import { useState, useCallback } from 'react';

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

const STATUS_LABELS: Record<string, string> = {
    '': 'Todos',
    ACTIVE: 'Ativa',
    EXPIRED: 'Expirada',
    CANCELLED: 'Cancelada',
};

type Tab = 'subscriptions' | 'plans' | 'logs';

const TABS: { key: Tab; label: string }[] = [
    { key: 'subscriptions', label: 'Assinaturas' },
    { key: 'plans', label: 'Planos' },
    { key: 'logs', label: 'Logs' },
];

const DashboardSubscriptions = () => {
    const [activeTab, setActiveTab] = useState<Tab>('subscriptions');

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
                showSuccessToast('Assinatura concedida com sucesso.');
                setIsGrantOpen(false);
                refetchSubscriptions();
            } catch {
                showErrorToast('Erro ao conceder assinatura.');
            } finally {
                setIsGrantSubmitting(false);
            }
        },
        [refetchSubscriptions],
    );

    const handleRevoke = useCallback(
        async (sub: AdminSubscription) => {
            try {
                await revokeSubscription(sub.id);
                showSuccessToast('Assinatura revogada com sucesso.');
                refetchSubscriptions();
            } catch {
                showErrorToast('Erro ao revogar assinatura.');
            }
        },
        [refetchSubscriptions],
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
            <h1 className="text-lg font-bold">Assinaturas</h1>

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
                    Erro ao carregar resumo de assinaturas.
                </p>
            ) : (
                <SubscriptionSummaryCards summary={summary} />
            )}

            {isLoadingGrowth ? (
                <div className="h-64 rounded-xs bg-tertiary/30 animate-pulse" />
            ) : growthData ? (
                <SubscriptionGrowthChart entries={growthData.entries} />
            ) : null}

            {/* Sub-tabs */}
            <div className="flex gap-1 overflow-x-auto border-b border-b-tertiary">
                {TABS.map(tab => (
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

            {/* ── Tab: Assinaturas ── */}
            {activeTab === 'subscriptions' && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-sm text-tertiary">
                                Status:
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
                                        {STATUS_LABELS[option] ?? option}
                                    </option>
                                ))}
                            </select>
                            <span className="text-sm text-tertiary">
                                {totalElements} assinaturas
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsGrantOpen(true)}
                            className="px-3 py-2 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80"
                        >
                            Conceder
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
                                    confirm('Deseja revogar esta assinatura?')
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

            {/* ── Tab: Planos ── */}
            {activeTab === 'plans' && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm text-tertiary">
                            Gerenciar planos de assinatura
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingPlan(null);
                                setIsPlanFormOpen(true);
                            }}
                            className="px-3 py-2 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80"
                        >
                            Novo Plano
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

            {/* ── Tab: Logs ── */}
            {activeTab === 'logs' && (
                <>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-tertiary">
                            ID da Assinatura:
                        </label>
                        <input
                            type="text"
                            value={selectedLogSubId ?? ''}
                            onChange={e =>
                                setSelectedLogSubId(e.target.value || null)
                            }
                            placeholder="Cole o UUID da assinatura"
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
