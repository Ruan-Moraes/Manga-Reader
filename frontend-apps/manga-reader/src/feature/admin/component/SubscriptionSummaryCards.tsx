import { FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

import MetricsCard from './MetricsCard';
import type { SubscriptionSummary } from '../type/admin.types';

type SubscriptionSummaryCardsProps = {
    summary: SubscriptionSummary;
};

const SubscriptionSummaryCards = ({
    summary,
}: SubscriptionSummaryCardsProps) => {
    return (
        <div className="grid gap-3 sm:grid-cols-3">
            <MetricsCard
                label="Assinaturas Ativas"
                value={summary.totalActive}
                icon={<FiCheckCircle size={18} />}
                accent="success"
            />
            <MetricsCard
                label="Expiradas"
                value={summary.totalExpired}
                icon={<FiClock size={18} />}
                accent="warning"
            />
            <MetricsCard
                label="Canceladas"
                value={summary.totalCancelled}
                icon={<FiXCircle size={18} />}
                accent="danger"
            />
        </div>
    );
};

export default SubscriptionSummaryCards;
