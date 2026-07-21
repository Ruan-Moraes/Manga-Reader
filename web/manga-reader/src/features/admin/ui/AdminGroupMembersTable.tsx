import { useTranslation } from 'react-i18next';

import { Badge } from '@ui/Badge';

import type { GroupMember } from '../model/admin.types';

const formatDateTime = (date: string | null, locale: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleString(locale);
};

const RoleBadge = ({ role }: { role: string | null }) => {
    if (!role) return <span className="text-mr-fg-subtle">—</span>;

    return <Badge variant={role === 'LIDER' ? 'accent' : 'neutral'}>{role}</Badge>;
};

type AdminGroupMembersTableProps = {
    members: GroupMember[];
    isSubmitting: boolean;
    onEditRole: (member: GroupMember) => void;
    onRemove: (userId: string, userName: string) => void;
};

const AdminGroupMembersTable = ({ members, isSubmitting, onEditRole, onRemove }: AdminGroupMembersTableProps) => {
    const { t, i18n } = useTranslation('admin');

    return (
        <div className="p-4 border rounded-xs bg-secondary border-tertiary">
            <h3 className="mb-3 text-sm font-semibold">{t('groupDetail.membersCount', { count: members.length })}</h3>

            {members.length === 0 ? (
                <p className="text-sm text-tertiary">{t('groupDetail.empty')}</p>
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
                            {members.map(member => (
                                <tr key={member.userId} className="border-b border-b-tertiary/50 transition-colors hover:bg-tertiary/15">
                                    <td className="px-4 py-3 font-medium">{member.userName}</td>
                                    <td className="px-4 py-3 text-tertiary hidden sm:table-cell">{member.userEmail}</td>
                                    <td className="px-4 py-3 text-tertiary hidden sm:table-cell">{member.type ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <RoleBadge role={member.role} />
                                    </td>
                                    <td className="px-4 py-3 text-xs text-tertiary hidden sm:table-cell">{formatDateTime(member.joinedAt, i18n.language)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => onEditRole(member)}
                                                className="px-2 py-1 text-xs border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                                            >
                                                {t('groupDetail.actions.role')}
                                            </button>
                                            <button
                                                onClick={() => onRemove(member.userId, member.userName)}
                                                disabled={isSubmitting}
                                                className="px-2 py-1 text-xs text-mr-danger border rounded-mr-xs border-mr-danger-border hover:bg-mr-danger-15 transition-colors disabled:opacity-50"
                                            >
                                                {t('groupDetail.actions.remove')}
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
    );
};

export default AdminGroupMembersTable;
