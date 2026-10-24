import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { resolveLocalized } from '@shared/type/i18n';
import { StatusPill } from '@ui/StatusPill';

import type { AdminGroup, GroupMember } from '../model/admin.types';
import { GROUP_STATUS_TONE, statusLabelKey, toneFor } from '../model/statusTone';
import useAdminGroupActions from '../model/useAdminGroupActions';
import ChangeGroupRoleModal from './modal/ChangeGroupRoleModal';
import AdminGroupMembersTable from './AdminGroupMembersTable';

type AdminGroupDetailProps = {
    group: AdminGroup;
};

const formatDateTime = (date: string | null, locale: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleString(locale);
};

const AdminGroupDetail = ({ group }: AdminGroupDetailProps) => {
    const { t, i18n } = useTranslation('admin');
    const { isSubmitting, handleChangeRole, handleRemoveMember } = useAdminGroupActions();
    const [editingMember, setEditingMember] = useState<GroupMember | null>(null);

    const confirmChangeRole = (role: string) => {
        if (editingMember) {
            handleChangeRole(group.id, editingMember.userId, role);
            setEditingMember(null);
        }
    };

    const confirmRemove = (userId: string, userName: string) => {
        if (window.confirm(t('groupDetail.removeConfirm', { name: userName }))) {
            handleRemoveMember(group.id, userId);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 border rounded-xs bg-secondary border-tertiary">
                {group.logo && (
                    <img
                        src={group.logo}
                        alt={resolveLocalized(group.name, i18n.language)}
                        className="object-cover rounded-xs w-16 h-16 border border-tertiary"
                    />
                )}
                <div className="flex-1">
                    <h2 className="text-lg font-bold">{resolveLocalized(group.name, i18n.language)}</h2>
                    <p className="text-sm text-tertiary">@{group.username}</p>
                    <div className="flex gap-2 mt-2">
                        <StatusPill tone={toneFor(GROUP_STATUS_TONE, group.status)}>{t(statusLabelKey('group', group.status), { defaultValue: group.status })}</StatusPill>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                    <h3 className="mb-2 text-sm font-semibold">{t('groupDetail.info')}</h3>
                    <dl className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-tertiary">{t('groupDetail.id')}</dt>
                            <dd className="font-mono text-xs">{group.id}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">{t('groupDetail.members')}</dt>
                            <dd>{group.membersCount}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">{t('groupDetail.titles')}</dt>
                            <dd>{group.totalTitles}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">{t('groupDetail.rating')}</dt>
                            <dd>{group.rating.toFixed(1)}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">{t('groupDetail.popularity')}</dt>
                            <dd>{group.popularity}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-tertiary">{t('groupDetail.joinedAt')}</dt>
                            <dd>{formatDateTime(group.platformJoinedAt, i18n.language)}</dd>
                        </div>
                    </dl>
                </div>

                {group.description && (
                    <div className="p-4 border rounded-xs bg-secondary border-tertiary">
                        <h3 className="mb-2 text-sm font-semibold">{t('groupDetail.description')}</h3>
                        <p className="text-sm text-tertiary">{resolveLocalized(group.description, i18n.language)}</p>
                    </div>
                )}
            </div>

            <AdminGroupMembersTable members={group.members} isSubmitting={isSubmitting} onEditRole={setEditingMember} onRemove={confirmRemove} />

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
