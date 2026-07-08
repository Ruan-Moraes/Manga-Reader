import { useTranslation } from 'react-i18next';
import { Award, ShieldOff, ShieldCheck } from 'lucide-react';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Avatar } from '@ui/Avatar';
import { Badge, type BadgeVariant } from '@ui/Badge';
import { StatusPill } from '@ui/StatusPill';
import { getLocale } from '@shared/lib/formatters';

import type { AdminUser } from '../../model/admin.types';

type AdminUserDetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    user: AdminUser | null;
    onChangeRole: () => void;
    onBan: () => void;
    onUnban: () => void;
};

const ROLE_VARIANT: Record<string, BadgeVariant> = {
    ADMIN: 'danger',
    MODERATOR: 'accent',
    MEMBER: 'neutral',
};

const formatDateTime = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const InfoRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 border-b border-mr-gray-900 py-2.5 last:border-b-0">
        <span className="text-mr-small text-mr-fg-subtle">{label}</span>
        <span className="min-w-0 text-right text-mr-small font-mr-bold text-mr-fg">{children}</span>
    </div>
);

const AdminUserDetailModal = ({ isOpen, onClose, user, onChangeRole, onBan, onUnban }: AdminUserDetailModalProps) => {
    const { t } = useTranslation('admin');

    return (
        <Modal
            open={isOpen && user !== null}
            onClose={onClose}
            title={t('userDetail.modalTitle')}
            size="md"
            footer={
                user && (
                    <>
                        <Button variant="ghost" size="sm" icon={Award} onClick={onChangeRole}>
                            {t('userDetail.changeRole')}
                        </Button>
                        {user.banned ? (
                            <Button variant="ghost" size="sm" danger icon={ShieldCheck} onClick={onUnban}>
                                {t('userDetail.unban')}
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" danger icon={ShieldOff} disabled={user.role === 'ADMIN'} onClick={onBan}>
                                {t('userDetail.ban')}
                            </Button>
                        )}
                    </>
                )
            }
        >
            {user && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 border-b border-mr-gray-900 pb-4">
                        <Avatar src={user.photoUrl ?? undefined} name={user.name} size={56} />
                        <div className="min-w-0">
                            <div className="text-mr-h4 font-mr-extrabold text-mr-fg">{user.name}</div>
                            <div className="break-all text-mr-small text-mr-fg-subtle">{user.email}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant={ROLE_VARIANT[user.role] ?? 'neutral'}>{t(`changeRole.roles.${user.role}`, user.role)}</Badge>
                                <StatusPill tone={user.banned ? 'ended' : 'live'}>{user.banned ? t('status.banned') : t('status.active')}</StatusPill>
                            </div>
                        </div>
                    </div>

                    <div>
                        <InfoRow label={t('userDetail.id')}>
                            <code className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{user.id}</code>
                        </InfoRow>
                        <InfoRow label={t('userDetail.createdAt')}>{formatDateTime(user.createdAt)}</InfoRow>
                        <InfoRow label={t('userDetail.updatedAt')}>{formatDateTime(user.updatedAt)}</InfoRow>
                    </div>

                    {user.banned && (
                        <div className="rounded-mr-sm border border-[rgba(255,120,79,0.4)] bg-mr-danger-15 p-3">
                            <h4 className="mb-2 text-mr-small font-mr-bold text-mr-danger">{t('userDetail.banDetails')}</h4>
                            <InfoRow label={t('userDetail.banReason')}>{user.bannedReason ?? '—'}</InfoRow>
                            <InfoRow label={t('userDetail.bannedAt')}>{formatDateTime(user.bannedAt)}</InfoRow>
                            <InfoRow label={t('userDetail.expiresAt')}>{user.bannedUntil ? formatDateTime(user.bannedUntil) : t('status.permanent')}</InfoRow>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default AdminUserDetailModal;
