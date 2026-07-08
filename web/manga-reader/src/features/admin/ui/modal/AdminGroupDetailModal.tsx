import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Award } from 'lucide-react';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Avatar } from '@ui/Avatar';
import { Badge } from '@ui/Badge';
import { StatusPill } from '@ui/StatusPill';
import { resolveLocalized } from '@shared/type/i18n';
import { getLocale } from '@shared/lib/formatters';
import { cn } from '@shared/lib/cn';

import useAdminGroupDetail from '../../model/useAdminGroupDetail';
import useAdminGroupActions from '../../model/useAdminGroupActions';
import { GROUP_STATUS_TONE, statusLabelKey, toneFor } from '../../model/statusTone';
import ChangeGroupRoleModal from './ChangeGroupRoleModal';

import type { GroupMember } from '../../model/admin.types';

type AdminGroupDetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    groupId: string | null;
    onEdit: () => void;
    onDelete: () => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 border-b border-mr-gray-900 py-2.5 last:border-b-0">
        <span className="text-mr-small text-mr-fg-subtle">{label}</span>
        <span className="text-right text-mr-small font-mr-bold text-mr-fg">{children}</span>
    </div>
);

const AdminGroupDetailModal = ({ isOpen, onClose, groupId, onEdit, onDelete }: AdminGroupDetailModalProps) => {
    const { t, i18n } = useTranslation('admin');
    const { group, isLoading } = useAdminGroupDetail(groupId ?? '');
    const { isSubmitting, handleChangeRole } = useAdminGroupActions();

    const [editingMember, setEditingMember] = useState<GroupMember | null>(null);

    const confirmChangeRole = async (role: string) => {
        if (group && editingMember) {
            await handleChangeRole(group.id, editingMember.userId, role);
            setEditingMember(null);
        }
    };

    const name = group ? resolveLocalized(group.name, i18n.language) : '';

    return (
        <>
            <Modal
                open={isOpen && groupId !== null}
                onClose={onClose}
                title={t('groupDetail.modalTitle')}
                size="lg"
                footer={
                    group && (
                        <>
                            <Button variant="ghost" size="sm" danger icon={Trash2} onClick={onDelete}>
                                {t('common.delete')}
                            </Button>
                            <Button variant="primary" size="sm" icon={Pencil} onClick={onEdit}>
                                {t('groupDetail.edit')}
                            </Button>
                        </>
                    )
                }
            >
                {isLoading || !group ? (
                    <div className="flex flex-col gap-3 p-2">
                        <div className="h-16 animate-mr-pulse rounded-mr-sm bg-mr-gray-800" />
                        <div className="h-32 animate-mr-pulse rounded-mr-sm bg-mr-gray-800" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 border-b border-mr-gray-900 pb-4">
                            <Avatar name={name} size={56} />
                            <div className="min-w-0">
                                <div className="text-mr-h4 font-mr-extrabold text-mr-fg">{name}</div>
                                <div className="font-mr-mono text-mr-small text-mr-accent">@{group.username}</div>
                                <div className="mt-2">
                                    <StatusPill tone={toneFor(GROUP_STATUS_TONE, group.status)}>
                                        {t(statusLabelKey('group', group.status), { defaultValue: group.status })}
                                    </StatusPill>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-x-8 sm:grid-cols-2">
                            <div>
                                <InfoRow label={t('groupDetail.id')}>
                                    <code className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{group.id}</code>
                                </InfoRow>
                                <InfoRow label={t('groupDetail.members')}>{group.membersCount}</InfoRow>
                                <InfoRow label={t('groupDetail.titles')}>{group.totalTitles}</InfoRow>
                            </div>
                            <div>
                                <InfoRow label={t('groupDetail.rating')}>★ {group.rating.toFixed(1)}</InfoRow>
                                <InfoRow label={t('groupDetail.popularity')}>{group.popularity}</InfoRow>
                                <InfoRow label={t('groupDetail.joinedAt')}>{formatDate(group.platformJoinedAt)}</InfoRow>
                            </div>
                        </div>

                        <div>
                            <div className="mb-1.5 text-mr-tiny font-mr-extrabold uppercase tracking-[0.08em] text-mr-fg-subtle">{t('groupDetail.description')}</div>
                            <p className="text-mr-body leading-relaxed text-mr-fg-muted">{resolveLocalized(group.description, i18n.language) || '—'}</p>
                        </div>

                        <div>
                            <div className="mb-2.5 text-mr-tiny font-mr-extrabold uppercase tracking-[0.08em] text-mr-fg-subtle">
                                {t('groupDetail.membersCount', { count: group.members.length })}
                            </div>
                            {group.members.length === 0 ? (
                                <p className="text-mr-small text-mr-fg-subtle">{t('groupDetail.empty')}</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {group.members.map(member => (
                                        <div
                                            key={member.userId}
                                            className="flex items-center gap-2.5 rounded-mr-sm border border-mr-gray-900 bg-mr-surface-muted px-2.5 py-2"
                                        >
                                            <Avatar name={member.userName} size={32} />
                                            <span className="min-w-0 flex-1 truncate font-mr-bold text-mr-fg">{member.userName}</span>
                                            <Badge variant={member.role === 'LIDER' ? 'accent' : 'neutral'}>
                                                {member.role ? t(`changeGroupRole.roles.${member.role}`, member.role) : '—'}
                                            </Badge>
                                            <button
                                                type="button"
                                                aria-label={t('groupDetail.changeMemberRole')}
                                                onClick={() => setEditingMember(member)}
                                                className={cn(
                                                    'flex size-8 items-center justify-center rounded-mr-xs border border-mr-border text-mr-fg-muted transition-colors',
                                                    'hover:border-mr-accent-50 hover:bg-mr-accent-25 hover:text-mr-accent',
                                                )}
                                            >
                                                <Award size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <ChangeGroupRoleModal
                isOpen={editingMember !== null}
                onClose={() => setEditingMember(null)}
                onConfirm={confirmChangeRole}
                memberName={editingMember?.userName ?? ''}
                currentRole={editingMember?.role ?? null}
                isSubmitting={isSubmitting}
            />
        </>
    );
};

export default AdminGroupDetailModal;
