import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@ui/Avatar';
import { Badge, type BadgeVariant } from '@ui/Badge';
import { StatusPill } from '@ui/StatusPill';

import type { AdminUser } from '../model/admin.types';

const ROLE_VARIANT: Record<string, BadgeVariant> = {
    ADMIN: 'danger',
    MODERATOR: 'accent',
    MEMBER: 'neutral',
};
import useAdminUserActions from '../model/useAdminUserActions';
import BanUserModal from './modal/BanUserModal';
import ChangeRoleModal from './modal/ChangeRoleModal';

type AdminUserDetailProps = {
    user: AdminUser;
};

const formatDateTime = (date: string | null, locale: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleString(locale);
};

const AdminUserDetail = ({ user }: AdminUserDetailProps) => {
    const { t, i18n } = useTranslation('admin');
    const { isSubmitting, handleChangeRole, handleBan, handleUnban } = useAdminUserActions();
    const [showBanModal, setShowBanModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 rounded-mr-md border border-mr-border bg-mr-surface p-4">
                <Avatar src={user.photoUrl ?? undefined} name={user.name} size={56} />
                <div className="flex-1">
                    <h2 className="text-mr-h3 font-mr-extrabold text-mr-fg">{user.name}</h2>
                    <p className="text-mr-small text-mr-fg-subtle">{user.email}</p>
                    <div className="mt-2 flex gap-2">
                        <Badge variant={ROLE_VARIANT[user.role] ?? 'neutral'}>{user.role}</Badge>
                        <StatusPill tone={user.banned ? 'ended' : 'live'}>{user.banned ? t('status.banned') : t('status.active')}</StatusPill>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-mr-md border border-mr-border bg-mr-surface p-4">
                    <h3 className="mb-2 text-mr-body font-mr-bold text-mr-fg">{t('userDetail.info')}</h3>
                    <dl className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-tertiary">{t('userDetail.id')}</dt>
                            <dd className="font-mono text-xs">{user.id}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">{t('userDetail.createdAt')}</dt>
                            <dd>{formatDateTime(user.createdAt, i18n.language)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">{t('userDetail.updatedAt')}</dt>
                            <dd>{formatDateTime(user.updatedAt, i18n.language)}</dd>
                        </div>
                    </dl>
                </div>

                {user.banned && (
                    <div className="rounded-mr-md border border-mr-danger-border bg-mr-danger-15 p-4">
                        <h3 className="mb-2 text-mr-body font-mr-bold text-mr-danger">{t('userDetail.banDetails')}</h3>
                        <dl className="flex flex-col gap-1 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-tertiary">{t('userDetail.banReason')}</dt>
                                <dd>{user.bannedReason ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-tertiary">{t('userDetail.bannedAt')}</dt>
                                <dd>{formatDateTime(user.bannedAt, i18n.language)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-tertiary">{t('userDetail.expiresAt')}</dt>
                                <dd>{user.bannedUntil ? formatDateTime(user.bannedUntil, i18n.language) : t('status.permanent')}</dd>
                            </div>
                        </dl>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setShowRoleModal(true)}
                    className="rounded-mr-xs border border-mr-tertiary bg-mr-secondary px-4 py-2 text-mr-small font-mr-bold text-mr-fg transition-colors hover:border-mr-accent-50 hover:bg-mr-accent-25"
                >
                    {t('userDetail.changeRole')}
                </button>
                {user.banned ? (
                    <button
                        onClick={() => handleUnban(user.id)}
                        disabled={isSubmitting}
                        className="rounded-mr-xs border border-mr-accent-50 bg-mr-accent-25 px-4 py-2 text-mr-small font-mr-bold text-mr-accent-fg transition-colors hover:bg-mr-accent-50 disabled:opacity-50"
                    >
                        {isSubmitting ? t('userDetail.unbanning') : t('userDetail.unban')}
                    </button>
                ) : (
                    <button
                        onClick={() => setShowBanModal(true)}
                        disabled={user.role === 'ADMIN'}
                        className="rounded-mr-xs border border-mr-danger-border bg-mr-danger-15 px-4 py-2 text-mr-small font-mr-bold text-mr-danger transition-colors hover:bg-mr-danger-15 disabled:opacity-50"
                    >
                        {t('userDetail.ban')}
                    </button>
                )}
            </div>

            <BanUserModal
                isOpen={showBanModal}
                onClose={() => setShowBanModal(false)}
                onConfirm={(reason, bannedUntil) => {
                    handleBan(user.id, { reason, bannedUntil });
                    setShowBanModal(false);
                }}
                userName={user.name}
                isSubmitting={isSubmitting}
            />

            <ChangeRoleModal
                isOpen={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                onConfirm={role => {
                    handleChangeRole(user.id, role);
                    setShowRoleModal(false);
                }}
                userName={user.name}
                currentRole={user.role}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default AdminUserDetail;
