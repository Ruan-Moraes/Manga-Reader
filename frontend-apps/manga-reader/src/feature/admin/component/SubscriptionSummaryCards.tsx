import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

import MetricsCard from './MetricsCard';
import type { SubscriptionSummary } from '../type/admin.types';

type SubscriptionSummaryCardsProps = {
    summary: SubscriptionSummary;
};

const SubscriptionSummaryCards = ({
    summary,
}: SubscriptionSummaryCardsProps) => {
    const { t } = useTranslation('admin');

    return (
        <div className="grid gap-3 sm:grid-cols-3">
            <MetricsCard
                label={t('dashboard.subscriptions.summary.active')}
                value={summary.totalActive}
                icon={<FiCheckCircle size={18} />}
                accent="success"
            />
            <MetricsCard
                label={t('dashboard.subscriptions.summary.expired')}
                value={summary.totalExpired}
                icon={<FiClock size={18} />}
                accent="warning"
            />
            <MetricsCard
                label={t('dashboard.subscriptions.summary.cancelled')}
                value={summary.totalCancelled}
                icon={<FiXCircle size={18} />}
                accent="danger"
            />
        </div>
    );
};

export default SubscriptionSummaryCards;
