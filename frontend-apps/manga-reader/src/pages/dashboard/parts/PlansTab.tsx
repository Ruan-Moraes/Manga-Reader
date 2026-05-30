import { useTranslation } from 'react-i18next';

import { AdminPlanList, PlanFormModal, type AdminPlan } from '@feature/admin';
import type { LocalizedString, LocalizedStringList } from '@shared/type/i18n';

type PlanSubmitData = {
    period?: string;
    priceInCents: number;
    description: LocalizedString;
    features: LocalizedStringList;
    active?: boolean;
    prices: Record<string, number>;
};

type Props = {
    plans: AdminPlan[];
    planPage: number;
    planTotalPages: number;
    isLoadingPlans: boolean;
    setPlanPage: (n: number) => void;
    editingPlan: AdminPlan | null;
    setEditingPlan: (p: AdminPlan | null) => void;
    isPlanFormOpen: boolean;
    setIsPlanFormOpen: (v: boolean) => void;
    isPlanSubmitting: boolean;
    handlePlanSubmit: (data: PlanSubmitData) => Promise<void>;
};

const PlansTab = ({
    plans,
    planPage,
    planTotalPages,
    isLoadingPlans,
    setPlanPage,
    editingPlan,
    setEditingPlan,
    isPlanFormOpen,
    setIsPlanFormOpen,
    isPlanSubmitting,
    handlePlanSubmit,
}: Props) => {
    const { t } = useTranslation('admin');

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-tertiary">{t('dashboard.subscriptions.plansManage')}</span>
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
    );
};

export default PlansTab;
