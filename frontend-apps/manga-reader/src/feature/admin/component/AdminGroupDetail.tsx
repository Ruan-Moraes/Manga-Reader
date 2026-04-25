import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AdminGroup, GroupMember } from '../type/admin.types';
import useAdminGroupActions from '../hook/useAdminGroupActions';
import ChangeGroupRoleModal from './modal/ChangeGroupRoleModal';

type AdminGroupDetailProps = {
    group: AdminGroup;
};

const formatDateTime = (date: string | null, locale: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleString(locale);
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        ACTIVE: 'bg-green-500/20 text-green-300',
        INACTIVE: 'bg-tertiary/30 text-tertiary',
        HIATUS: 'bg-yellow-500/20 text-yellow-300',
    };

    return (
        <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${colors[status] ?? 'bg-tertiary/30'}`}
        >
            {status}
        </span>
    );
};

const RoleBadge = ({ role }: { role: string | null }) => {
    const colors: Record<string, string> = {
        LIDER: 'bg-red-500/20 text-red-300',
        TRADUTOR: 'bg-blue-500/20 text-blue-300',
        REVISOR: 'bg-yellow-500/20 text-yellow-300',
        QC: 'bg-purple-500/20 text-purple-300',
        CLEANER: 'bg-green-500/20 text-green-300',
        TYPESETTER: 'bg-cyan-500/20 text-cyan-300',
    };

    return (
        <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${colors[role ?? ''] ?? 'bg-tertiary/30'}`}
        >
            {role ?? '—'}
        </span>
    );
};

const AdminGroupDetail = ({ group }: AdminGroupDetailProps) => {
    const { t, i18n } = useTranslation('admin');
    const { isSubmitting, handleChangeRole, handleRemoveMember } =
        useAdminGroupActions();
    const [editingMember, setEditingMember] = useState<GroupMember | null>(
        null,
    );

    const confirmChangeRole = (role: string) => {
        if (editingMember) {
            handleChangeRole(group.id, editingMember.userId, role);
            setEditingMember(null);
        }
    };

    const confirmRemove = (userId: string, userName: string) => {
        if (
            window.confirm(
                t('groupDetail.removeConfirm', { name: userName }),
            )
        ) {
            handleRemoveMember(group.id, userId);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 border rounded-xs bg-secondary border-tertiary">
                {group.logo && (
                    <img
                        src={group.logo}
                        alt={group.name}
                        className="object-cover rounded-xs w-16 h-16 border border-tertiary"
                    />
                )}
                <div className="flex-1">
                    <h2 className="text-lg font-bold">{group.name}</h2>
                    <p className="text-sm text-tertiary">@{group.username}</p>
                    <div className="flex gap-2 mt-2">
                        <StatusBadge status={group.status} />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                    <h3 className="mb-2 text-sm font-semibold">
                        {t('groupDetail.info')}
                    </h3>
                    <dl className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-tertiary">
                                {t('groupDetail.id')}
                            </dt>
                            <dd className="font-mono text-xs">{group.id}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">
                                {t('groupDetail.members')}
                            </dt>
                            <dd>{group.membersCount}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">
                                {t('groupDetail.titles')}
                            </dt>
                            <dd>{group.totalTitles}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">
                                {t('groupDetail.rating')}
                            </dt>
                            <dd>{group.rating.toFixed(1)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">
                                {t('groupDetail.popularity')}
                            </dt>
                            <dd>{group.popularity}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">
                                {t('groupDetail.joinedAt')}
                            </dt>
                            <dd>
                                {formatDateTime(
                                    group.platformJoinedAt,
                                    i18n.language,
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>

                {group.description && (
                    <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                        <h3 className="mb-2 text-sm font-semibold">
                            {t('groupDetail.description')}
                        </h3>
                        <p className="text-sm text-tertiary">
                            {group.description}
                        </p>
                    </div>
                )}
            </div>

            <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                <h3 className="mb-3 text-sm font-semibold">
                    {t('groupDetail.membersCount', {
                        count: group.members.length,
                    })}
                </h3>

                {group.members.length === 0 ? (
                    <p className="text-sm text-tertiary">
                        {t('groupDetail.empty')}
                    </p>
                ) : (
                    <div className="overflow-x-auto border rounded-xs border-tertiary">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-secondary border-b-tertiary">
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tertiary">
                                        {t('groupDetail.table.name')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tertiary hidden sm:table-cell">
                                        {t('groupDetail.table.email')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tertiary hidden sm:table-cell">
                                        {t('groupDetail.table.type')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tertiary">
                                        {t('groupDetail.table.role')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tertiary hidden sm:table-cell">
                                        {t('groupDetail.table.joinedAt')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-tertiary">
                                        {t('groupDetail.table.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {group.members.map(member => (
                                    <tr
                                        key={member.userId}
                                        className="border-b border-b-tertiary/50 transition-colors hover:bg-tertiary/15"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {member.userName}
                                        </td>
                                        <td className="px-4 py-3 text-tertiary hidden sm:table-cell">
                                            {member.userEmail}
                                        </td>
                                        <td className="px-4 py-3 text-tertiary hidden sm:table-cell">
                                            {member.type ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <RoleBadge role={member.role} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-tertiary hidden sm:table-cell">
                                            {formatDateTime(
                                                member.joinedAt,
                                                i18n.language,
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() =>
                                                        setEditingMember(member)
                                                    }
                                                    className="px-2 py-1 text-xs border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                                                >
                                                    {t(
                                                        'groupDetail.actions.role',
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        confirmRemove(
                                                            member.userId,
                                                            member.userName,
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                    className="px-2 py-1 text-xs text-red-400 border rounded-xs border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                                >
                                                    {t(
                                                        'groupDetail.actions.remove',
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ChangeGroupRoleModal
                isOpen={editingMember !== null}
                onClose={() => setEditingMember(null)}
                onConfirm={confirmChangeRole}
                memberName={editingMember?.userName ?? ''}
                currentRole={editingMember?.role ?? null}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default AdminGroupDetail;
