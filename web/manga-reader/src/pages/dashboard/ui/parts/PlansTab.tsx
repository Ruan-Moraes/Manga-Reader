import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { AdminPlanList, PlanFormModal, type AdminPlan } from '@features/admin';
import { Button } from '@ui/Button';
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
                <span className="text-mr-small text-mr-fg-subtle">{t('dashboard.subscriptions.plansManage')}</span>
                <Button
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    onClick={() => {
                        setEditingPlan(null);
                        setIsPlanFormOpen(true);
                    }}
                >
                    {t('dashboard.subscriptions.planNew')}
                </Button>
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
