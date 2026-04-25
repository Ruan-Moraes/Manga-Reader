import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import UserAvatar from '@shared/component/avatar/UserAvatar';

import type { AdminUser } from '../type/admin.types';
import useAdminUserActions from '../hook/useAdminUserActions';
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
    const { isSubmitting, handleChangeRole, handleBan, handleUnban } =
        useAdminUserActions();
    const [showBanModal, setShowBanModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 border rounded-xs bg-secondary border-tertiary">
                <UserAvatar
                    src={user.photoUrl}
                    name={user.name}
                    size="lg"
                    rounded="xs"
                    className="border border-tertiary"
                />
                <div className="flex-1">
                    <h2 className="text-lg font-bold">{user.name}</h2>
                    <p className="text-sm text-tertiary">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                        <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${
                                user.role === 'ADMIN'
                                    ? 'bg-red-500/20 text-red-300'
                                    : user.role === 'MODERATOR'
                                      ? 'bg-yellow-500/20 text-yellow-300'
                                      : 'bg-blue-500/20 text-blue-300'
                            }`}
                        >
                            {user.role}
                        </span>
                        <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${
                                user.banned
                                    ? 'bg-red-500/20 text-red-300'
                                    : 'bg-green-500/20 text-green-300'
                            }`}
                        >
                            {user.banned
                                ? t('status.banned')
                                : t('status.active')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                    <h3 className="mb-2 text-sm font-semibold">
                        {t('userDetail.info')}
                    </h3>
                    <dl className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-tertiary">
                                {t('userDetail.id')}
                            </dt>
                            <dd className="font-mono text-xs">{user.id}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">
                                {t('userDetail.createdAt')}
                            </dt>
                            <dd>
                                {formatDateTime(user.createdAt, i18n.language)}
                            </dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">
                                {t('userDetail.updatedAt')}
                            </dt>
                            <dd>
                                {formatDateTime(user.updatedAt, i18n.language)}
                            </dd>
                        </div>
                    </dl>
                </div>

                {user.banned && (
                    <div className="p-4 border border-red-500/30 rounded-xs bg-red-500/10">
                        <h3 className="mb-2 text-sm font-semibold text-red-300">
                            {t('userDetail.banDetails')}
                        </h3>
                        <dl className="flex flex-col gap-1 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-tertiary">
                                    {t('userDetail.banReason')}
                                </dt>
                                <dd>{user.bannedReason ?? '—'}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-tertiary">
                                    {t('userDetail.bannedAt')}
                                </dt>
                                <dd>
                                    {formatDateTime(
                                        user.bannedAt,
                                        i18n.language,
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-tertiary">
                                    {t('userDetail.expiresAt')}
                                </dt>
                                <dd>
                                    {user.bannedUntil
                                        ? formatDateTime(
                                              user.bannedUntil,
                                              i18n.language,
                                          )
                                        : t('status.permanent')}
                                </dd>
                            </div>
                        </dl>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setShowRoleModal(true)}
                    className="px-4 py-2 text-sm font-semibold border rounded-xs border-tertiary hover:bg-tertiary/30"
                >
                    {t('userDetail.changeRole')}
                </button>
                {user.banned ? (
                    <button
                        onClick={() => handleUnban(user.id)}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-semibold text-green-300 border border-green-500/30 rounded-xs bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('userDetail.unbanning')
                            : t('userDetail.unban')}
                    </button>
                ) : (
                    <button
                        onClick={() => setShowBanModal(true)}
                        disabled={user.role === 'ADMIN'}
                        className="px-4 py-2 text-sm font-semibold text-red-300 border border-red-500/30 rounded-xs bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50"
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
