import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { getLocale } from '@shared/lib/formatters';
import { toneFillClass, type StatusTone } from '@ui/StatusPill';
import { cn } from '@shared/lib/cn';

import { getSubscriptionAuditLogs } from '../api/adminSubscriptionService';
import type { SubscriptionAuditLogEntry } from '../model/admin.types';

type SubscriptionAuditLogProps = {
    subscriptionId: string | null;
};

const ACTION_TONE: Record<string, StatusTone> = {
    CREATED: 'live',
    GRANTED: 'open',
    CANCELLED: 'ended',
    REVOKED: 'ended',
    EXPIRED: 'soon',
    STATUS_CHANGED: 'open',
};

const formatDate = (date: string) =>
    new Date(date).toLocaleString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const SubscriptionAuditLog = ({ subscriptionId }: SubscriptionAuditLogProps) => {
    const { t } = useTranslation('admin');

    const { data, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_SUBSCRIPTION_LOGS, subscriptionId],
        queryFn: () => getSubscriptionAuditLogs(subscriptionId!, 0, 50),
        enabled: !!subscriptionId,
    });

    if (!subscriptionId) {
        return <p className="py-8 text-center text-mr-small text-mr-fg-subtle">{t('subscriptionAudit.selectPrompt')}</p>;
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 animate-mr-pulse rounded-mr-xs bg-mr-gray-800" />
                ))}
            </div>
        );
    }

    const logs: SubscriptionAuditLogEntry[] = data?.content ?? [];

    if (logs.length === 0) {
        return <p className="py-8 text-center text-mr-small text-mr-fg-subtle">{t('subscriptionAudit.empty')}</p>;
    }

    return (
        <div className="flex flex-col">
            {logs.map(log => (
                <div key={log.id} className="flex gap-3 border-b border-mr-gray-900 py-3 last:border-b-0">
                    <span className={cn('mt-1.5 size-2.5 shrink-0 rounded-mr-full', toneFillClass[ACTION_TONE[log.action] ?? 'soon'])} />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-mr-small font-mr-bold text-mr-fg">{t(`subscriptionAudit.action.${log.action}`, { defaultValue: log.action })}</span>
                            <span className="text-mr-tiny text-mr-fg-subtle">{formatDate(log.createdAt)}</span>
                        </div>
                        {log.details && <p className="text-mr-tiny text-mr-fg-subtle">{log.details}</p>}
                        {log.performedBy && (
                            <p className="text-mr-tiny text-mr-fg-subtle">
                                {t('subscriptionAudit.by')} <span className="font-mr-mono">{log.performedBy.slice(0, 8)}</span>
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SubscriptionAuditLog;
