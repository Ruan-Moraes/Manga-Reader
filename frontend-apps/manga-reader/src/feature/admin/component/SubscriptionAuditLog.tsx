import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getSubscriptionAuditLogs } from '../service/adminSubscriptionService';
import type { SubscriptionAuditLogEntry } from '../type/admin.types';

type SubscriptionAuditLogProps = {
    subscriptionId: string | null;
};

const ACTION_LABELS: Record<string, string> = {
    CREATED: 'Criada',
    CANCELLED: 'Cancelada',
    EXPIRED: 'Expirada',
    GRANTED: 'Concedida',
    REVOKED: 'Revogada',
    STATUS_CHANGED: 'Status alterado',
};

const ACTION_COLORS: Record<string, string> = {
    CREATED: 'bg-green-500/20 text-green-300',
    GRANTED: 'bg-blue-500/20 text-blue-300',
    CANCELLED: 'bg-red-500/20 text-red-300',
    REVOKED: 'bg-red-500/20 text-red-300',
    EXPIRED: 'bg-yellow-500/20 text-yellow-300',
    STATUS_CHANGED: 'bg-purple-500/20 text-purple-300',
};

const formatDate = (date: string) =>
    new Date(date).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const SubscriptionAuditLog = ({
    subscriptionId,
}: SubscriptionAuditLogProps) => {
    const { data, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_SUBSCRIPTION_LOGS, subscriptionId],
        queryFn: () => getSubscriptionAuditLogs(subscriptionId!, 0, 50),
        enabled: !!subscriptionId,
    });

    if (!subscriptionId) {
        return (
            <p className="py-8 text-sm text-center text-tertiary">
                Selecione uma assinatura para ver os logs.
            </p>
        );
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-12 rounded-xs bg-tertiary/30 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    const logs: SubscriptionAuditLogEntry[] = data?.content ?? [];

    if (logs.length === 0) {
        return (
            <p className="py-8 text-sm text-center text-tertiary">
                Nenhum log encontrado para esta assinatura.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {logs.map(log => (
                <div
                    key={log.id}
                    className="flex flex-col gap-1 p-3 border rounded-xs border-tertiary/50"
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${
                                ACTION_COLORS[log.action] ?? 'bg-tertiary/30'
                            }`}
                        >
                            {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                        <span className="text-xs text-tertiary">
                            {formatDate(log.createdAt)}
                        </span>
                    </div>
                    {log.details && (
                        <p className="text-xs text-tertiary">{log.details}</p>
                    )}
                    {log.performedBy && (
                        <p className="text-xs text-tertiary">
                            Por:{' '}
                            <span className="font-mono">
                                {log.performedBy.slice(0, 8)}
                            </span>
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default SubscriptionAuditLog;
