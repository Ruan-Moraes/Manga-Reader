import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';

import useUserGroups from '../../../model/useUserGroups';
import { type UserGroupItem } from '../../../api/userService';
import { PE, peEyebrow, peIntro } from './peShared';

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
            showErrorToast(t('profile.edit.saveError'));
        } finally {
            setPendingId(null);
        }
    };

    if (loading) return <p style={{ fontSize: 12, color: PE.hint, textAlign: 'center', padding: '32px 0' }}>{t('profile.edit.loading')}</p>;
    if (error) return <p style={{ fontSize: 12, color: PE.danger, textAlign: 'center', padding: '32px 0' }}>{error}</p>;

    const actionBtn = (g: UserGroupItem, linked: boolean) => (
        <button
            type="button"
            disabled={pendingId === g.id}
            onClick={() => run(g.id, linked ? unlink : link)}
            style={{
                padding: '8px 12px',
                background: linked ? 'transparent' : PE.accent,
                color: linked ? PE.danger : '#161616',
                border: `1px solid ${linked ? PE.danger : PE.accent}`,
                borderRadius: 2,
                fontSize: 11,
                fontWeight: 700,
                cursor: pendingId === g.id ? 'default' : 'pointer',
                opacity: pendingId === g.id ? 0.6 : 1,
                fontFamily: 'inherit',
                letterSpacing: '.0625rem',
                whiteSpace: 'nowrap',
            }}
        >
            {linked ? t('profile.edit.groups.unlink') : t('profile.edit.groups.link')}
        </button>
    );

    const row = (g: UserGroupItem, linked: boolean) => (
        <div
            key={g.id}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                marginBottom: 8,
                background: linked ? PE.cardBg : PE.mutedBg,
                border: `1px solid ${linked ? PE.accent : PE.cardBorder}`,
                borderRadius: 4,
            }}
        >
            <Avatar src={g.logo ?? undefined} name={initials(g.name)} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: PE.fg, letterSpacing: '.0625rem' }}>{g.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: PE.hint, marginTop: 2 }}>
                    {linked && g.role && <Badge variant="neutral">{g.role}</Badge>}
                    <span>{t('profile.edit.groups.members', { count: g.memberCount })}</span>
                </div>
            </div>
            {actionBtn(g, linked)}
        </div>
    );

    return (
        <div>
            <p style={{ ...peIntro, marginBottom: 14 }}>{t('profile.edit.groups.intro')}</p>

            {groups.linked.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                    <div style={peEyebrow(PE.accent)}>{t('profile.edit.groups.linkedHeading', { count: groups.linked.length })}</div>
                    {groups.linked.map(g => row(g, true))}
                </div>
            )}

            {groups.available.length > 0 && (
                <div>
                    <div style={peEyebrow(PE.tertiary)}>{t('profile.edit.groups.availableHeading')}</div>
                    {groups.available.map(g => row(g, false))}
                </div>
            )}

            {groups.linked.length === 0 && groups.available.length === 0 && (
                <p style={{ fontSize: 12, color: PE.hint, textAlign: 'center', padding: '24px 0' }}>{t('profile.edit.groups.availableEmpty')}</p>
            )}
        </div>
    );
};

export default GruposTab;
