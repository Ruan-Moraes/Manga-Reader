import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { showSuccessToast } from '@shared/service/util/toastService';

import useUserGroups from '../../../model/useUserGroups';
import { type UserGroupItem } from '../../../api/userService';
import { cn } from '@shared/lib/cn';

import { peEyebrow } from './peShared';

const initials = (name: string) =>
    name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

const GruposTab = () => {
    const { t } = useTranslation('user');
    const { groups, loading, error, link, unlink } = useUserGroups(true);
    const [pendingId, setPendingId] = useState<string | null>(null);

    const run = async (groupId: string, action: (id: string) => Promise<void>) => {
        setPendingId(groupId);
        try {
            await action(groupId);
            showSuccessToast(t('profile.edit.saved'));
        } catch {
            // Toast de erro já disparado pelo interceptor Axios (httpInterceptors.ts),
            // com a mensagem real vinda do backend.
        } finally {
            setPendingId(null);
        }
    };

    if (loading) return <p className="py-8 text-center text-ui-small text-ui-gray-300">{t('profile.edit.loading')}</p>;
    if (error) return <p className="py-8 text-center text-ui-small text-ui-danger">{error}</p>;

    const actionBtn = (g: UserGroupItem, linked: boolean) => (
        <button
            type="button"
            disabled={pendingId === g.id}
            onClick={() => run(g.id, linked ? unlink : link)}
            className={cn(
                'ui-focus-ring cursor-pointer whitespace-nowrap rounded-ui-xs border px-3 py-2 font-ui-sans text-ui-tiny font-ui-bold tracking-mr disabled:cursor-default disabled:opacity-60',
                linked ? 'border-ui-danger bg-transparent text-ui-danger' : 'border-ui-accent-border bg-ui-accent text-ui-on-accent',
            )}
        >
            {linked ? t('profile.edit.groups.unlink') : t('profile.edit.groups.link')}
        </button>
    );

    const row = (g: UserGroupItem, linked: boolean) => (
        <div
            key={g.id}
            className={cn(
                'mb-2 flex items-center gap-3 rounded-ui-sm border p-3',
                linked ? 'border-ui-accent-border bg-ui-surface-interactive' : 'border-ui-border bg-ui-gray-900',
            )}
        >
            <Avatar src={g.logo ?? undefined} name={initials(g.name)} size={40} />
            <div className="min-w-0 flex-1">
                <div className="text-[13px] font-ui-bold tracking-mr text-ui-fg">{g.name}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-ui-tiny text-ui-gray-300">
                    {linked && g.role && <Badge variant="neutral">{g.role}</Badge>}
                    <span>{t('profile.edit.groups.members', { count: g.memberCount })}</span>
                </div>
            </div>
            {actionBtn(g, linked)}
        </div>
    );

    return (
        <div>
            <p className="mb-3.5 text-ui-small leading-relaxed text-ui-gray-200">{t('profile.edit.groups.intro')}</p>

            {groups.linked.length > 0 && (
                <div className="mb-[18px]">
                    <div className={peEyebrow('accent')}>{t('profile.edit.groups.linkedHeading', { count: groups.linked.length })}</div>
                    {groups.linked.map(g => row(g, true))}
                </div>
            )}

            {groups.available.length > 0 && (
                <div>
                    <div className={peEyebrow('muted')}>{t('profile.edit.groups.availableHeading')}</div>
                    {groups.available.map(g => row(g, false))}
                </div>
            )}

            {groups.linked.length === 0 && groups.available.length === 0 && (
                <p className="py-6 text-center text-ui-small text-ui-gray-300">{t('profile.edit.groups.availableEmpty')}</p>
            )}
        </div>
    );
};

export default GruposTab;
