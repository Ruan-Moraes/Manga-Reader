import { useTranslation } from 'react-i18next';
import { SubscriptionAuditLog } from '@feature/admin';

type Props = {
    selectedLogSubId: string | null;
    setSelectedLogSubId: (id: string | null) => void;
};

const AuditLogTab = ({ selectedLogSubId, setSelectedLogSubId }: Props) => {
    const { t } = useTranslation('admin');

    return (
        <>
            <div className="flex flex-col gap-2">
                <label className="text-sm text-tertiary">{t('dashboard.subscriptions.logSubIdLabel')}</label>
                <input
                    type="text"
                    value={selectedLogSubId ?? ''}
                    onChange={e => setSelectedLogSubId(e.target.value || null)}
                    placeholder={t('dashboard.subscriptions.logSubIdPlaceholder')}
                    className="px-3 py-2 text-sm border rounded-xs bg-secondary border-tertiary"
                />
            </div>
            <SubscriptionAuditLog subscriptionId={selectedLogSubId} />
        </>
    );
};

export default AuditLogTab;
