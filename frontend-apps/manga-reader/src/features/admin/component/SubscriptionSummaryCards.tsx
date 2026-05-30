import { useTranslation } from 'react-i18next';

import MetricsCard from './MetricsCard';
import type { SubscriptionSummary } from '../type/admin.types';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

type SubscriptionSummaryCardsProps = {
    summary: SubscriptionSummary;
};

const SubscriptionSummaryCards = ({ summary }: SubscriptionSummaryCardsProps) => {
    const { t } = useTranslation('admin');

    return (
        <div className="grid gap-3 sm:grid-cols-3">
            <MetricsCard label={t('dashboard.subscriptions.summary.active')} value={summary.totalActive} icon={<CheckCircle size={18} />} accent="success" />
            <MetricsCard label={t('dashboard.subscriptions.summary.expired')} value={summary.totalExpired} icon={<Clock size={18} />} accent="warning" />
            <MetricsCard label={t('dashboard.subscriptions.summary.cancelled')} value={summary.totalCancelled} icon={<XCircle size={18} />} accent="danger" />
        </div>
    );
};

export default SubscriptionSummaryCards;
