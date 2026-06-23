import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
    AdminSubscriptionList,
    UpdateSubscriptionStatusModal,
    ConfirmDeleteWithIdModal,
    GrantSubscriptionModal,
    type AdminSubscription,
} from '@features/admin';
import { Select } from '@ui/Select';
import { Button } from '@ui/Button';
import { Plus } from 'lucide-react';

const STATUS_OPTIONS = ['', 'ACTIVE', 'EXPIRED', 'CANCELLED'] as const;

type Props = {
    subscriptions: AdminSubscription[];
    page: number;
    totalPages: number;
    totalElements: number;
    isLoading: boolean;
    statusFilter: string;
    setStatusFilter: (v: string) => void;
    setPage: (n: number) => void;
    editingSubscription: AdminSubscription | null;
    setEditingSubscription: (s: AdminSubscription | null) => void;
    deletingSubscription: AdminSubscription | null;
    setDeletingSubscription: (s: AdminSubscription | null) => void;
    isGrantOpen: boolean;
    setIsGrantOpen: (v: boolean) => void;
    isGrantSubmitting: boolean;
    isSubmitting: boolean;
    confirmUpdate: (status: string) => Promise<void>;
    handleGrant: (userId: string, planId: string) => Promise<void>;
    handleRevoke: () => Promise<void>;
};

const SubscriptionsTab = ({
    subscriptions,
    page,
    totalPages,
    totalElements,
    isLoading,
    statusFilter,
    setStatusFilter,
    setPage,
    editingSubscription,
    setEditingSubscription,
    deletingSubscription,
    setDeletingSubscription,
    isGrantOpen,
    setIsGrantOpen,
    isGrantSubmitting,
    isSubmitting,
    confirmUpdate,
    handleGrant,
    handleRevoke,
}: Props) => {
    const { t } = useTranslation('admin');

    const statusLabels = useMemo<Record<string, string>>(
        () => ({
            '': t('dashboard.subscriptions.statusAll'),
            ACTIVE: t('dashboard.subscriptions.statusActive'),
            EXPIRED: t('dashboard.subscriptions.statusExpired'),
            CANCELLED: t('dashboard.subscriptions.statusCancelled'),
        }),
        [t],
    );

    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-mr-small font-mr-bold text-mr-fg-subtle">{t('dashboard.subscriptions.statusLabel')}</span>
                    <div className="min-w-[10rem]">
                        <Select
                            value={statusFilter}
                            onChange={e => {
                                setStatusFilter(e.target.value);
                                setPage(0);
                            }}
                            options={STATUS_OPTIONS.map(option => ({
                                value: option,
                                label: statusLabels[option] ?? option,
                            }))}
                        />
                    </div>
                    <span className="text-mr-small text-mr-fg-subtle">
                        {t('dashboard.subscriptions.count', {
                            count: totalElements,
                        })}
                    </span>
                </div>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsGrantOpen(true)}>
                    {t('dashboard.subscriptions.grant')}
                </Button>
            </div>

            <AdminSubscriptionList
                subscriptions={subscriptions}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={setEditingSubscription}
                onDelete={setDeletingSubscription}
            />

            <UpdateSubscriptionStatusModal
                isOpen={editingSubscription !== null}
                onClose={() => setEditingSubscription(null)}
                onConfirm={confirmUpdate}
                subscriptionId={editingSubscription?.id ?? ''}
                currentStatus={editingSubscription?.status ?? 'ACTIVE'}
                isSubmitting={isSubmitting}
            />

            <GrantSubscriptionModal isOpen={isGrantOpen} onClose={() => setIsGrantOpen(false)} onSubmit={handleGrant} isSubmitting={isGrantSubmitting} />

            <ConfirmDeleteWithIdModal
                isOpen={deletingSubscription !== null}
                onClose={() => setDeletingSubscription(null)}
                onConfirm={handleRevoke}
                entityId={deletingSubscription?.id ?? ''}
                title={t('dashboard.subscriptions.deleteTitle')}
                message={t('dashboard.subscriptions.deleteConfirm')}
                isSubmitting={false}
            />
        </>
    );
};

export default SubscriptionsTab;
