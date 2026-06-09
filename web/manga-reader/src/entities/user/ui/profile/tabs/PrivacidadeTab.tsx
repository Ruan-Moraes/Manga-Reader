import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Library, MessageSquare, type LucideIcon } from 'lucide-react';

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';

import { deleteMyAccount, updatePrivacySettings } from '../../../api/userService';
import { type EnrichedProfile, type VisibilitySetting } from '../../../model/user.types';
import { cn } from '@shared/lib/cn';

import { peIntro } from './peShared';

const isPublic = (v?: VisibilitySetting) => v === 'PUBLIC';
const toVisibility = (on: boolean): VisibilitySetting => (on ? 'PUBLIC' : 'PRIVATE');

const PEToggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
            'mr-focus-ring relative h-6 w-11 shrink-0 cursor-pointer rounded-full border p-0 transition-all duration-200',
            checked ? 'border-mr-accent bg-mr-accent' : 'border-[#444] bg-[#333]',
        )}
    >
        <span
            className={cn(
                'absolute top-0.5 size-[18px] rounded-full transition-[left,background] duration-200',
                checked ? 'left-[22px] bg-mr-primary' : 'left-0.5 bg-mr-gray-300',
            )}
        />
    </button>
);

type Props = { profile: EnrichedProfile; onAccountDeleted: () => void };

const PrivacidadeTab = ({ profile, onAccountDeleted }: Props) => {
    const { t } = useTranslation('user');

    const [showHistory, setShowHistory] = useState(isPublic(profile.privacySettings?.viewHistoryVisibility));
    const [showComments, setShowComments] = useState(isPublic(profile.privacySettings?.commentVisibility));
    const [confirming, setConfirming] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const persist = async (patch: Parameters<typeof updatePrivacySettings>[0], rollback: () => void) => {
        try {
            await updatePrivacySettings(patch);
            showSuccessToast(t('profile.edit.saved'));
        } catch {
            rollback();
            showErrorToast(t('profile.edit.saveError'));
        }
    };

    const toggleHistory = (on: boolean) => {
        setShowHistory(on);
        persist({ viewHistoryVisibility: toVisibility(on) }, () => setShowHistory(!on));
    };
    const toggleComments = (on: boolean) => {
        setShowComments(on);
        persist({ commentVisibility: toVisibility(on) }, () => setShowComments(!on));
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await deleteMyAccount();
            onAccountDeleted();
        } catch {
            showErrorToast(t('profile.edit.saveError'));
            setDeleting(false);
        }
    };

    const items: { key: string; title: string; desc: string; icon: LucideIcon; checked: boolean; onChange: (v: boolean) => void }[] = [
        {
            key: 'history',
            title: t('profile.edit.privacy.historyLabel'),
            desc: t('profile.edit.privacy.historyDesc'),
            icon: Library,
            checked: showHistory,
            onChange: toggleHistory,
        },
        {
            key: 'comments',
            title: t('profile.edit.privacy.commentsLabel'),
            desc: t('profile.edit.privacy.commentsDesc'),
            icon: MessageSquare,
            checked: showComments,
            onChange: toggleComments,
        },
    ];

    const canDelete = confirmText.trim() === profile.name && !deleting;

    return (
        <div>
            <p className={peIntro}>{t('profile.edit.privacy.intro')}</p>

            {items.map(it => {
                const Icon = it.icon;
                return (
                    <div key={it.key} className="mb-2.5 flex items-start gap-3.5 rounded-mr-sm border border-[#333333] bg-[#1f1f20] p-3.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-mr-xs bg-mr-accent-10 text-mr-accent">
                            <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 text-[13px] font-mr-bold tracking-mr text-mr-fg">{it.title}</div>
                            <div className="text-mr-small leading-normal text-mr-gray-300">{it.desc}</div>
                        </div>
                        <PEToggle checked={it.checked} onChange={it.onChange} />
                    </div>
                );
            })}

            <div className="mt-3.5 rounded-mr-sm border border-[rgba(255,120,79,0.4)] bg-[rgba(255,120,79,0.08)] p-3.5">
                <div className="mb-1.5 text-mr-tiny font-mr-extrabold uppercase tracking-mr-label text-mr-danger">{t('profile.edit.privacy.dangerZone')}</div>
                <p className="mb-2.5 text-mr-small leading-relaxed text-mr-gray-200">{t('profile.edit.privacy.deleteDesc')}</p>

                {!confirming ? (
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="mr-focus-ring cursor-pointer rounded-mr-xs border border-mr-danger bg-transparent px-3 py-2 font-mr-sans text-mr-tiny font-mr-bold tracking-mr text-mr-danger"
                    >
                        {t('profile.edit.privacy.deleteAccount')}
                    </button>
                ) : (
                    <div className="flex flex-col gap-2">
                        <input
                            value={confirmText}
                            placeholder={t('profile.edit.privacy.deleteConfirmPlaceholder', { name: profile.name })}
                            onChange={e => setConfirmText(e.target.value)}
                            className="box-border h-10 w-full rounded-mr-xs border border-mr-danger bg-mr-secondary px-3 font-mr-sans text-[13px] tracking-mr text-mr-fg outline-none"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                disabled={!canDelete}
                                onClick={confirmDelete}
                                className={cn(
                                    'rounded-mr-xs border px-3 py-2 font-mr-sans text-mr-tiny font-mr-bold tracking-mr',
                                    canDelete
                                        ? 'mr-focus-ring cursor-pointer border-mr-danger bg-mr-danger text-mr-primary'
                                        : 'cursor-default border-mr-tertiary bg-transparent text-mr-tertiary',
                                )}
                            >
                                {t('profile.edit.privacy.deleteConfirm')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setConfirming(false);
                                    setConfirmText('');
                                }}
                                className="mr-focus-ring cursor-pointer rounded-mr-xs border border-mr-tertiary bg-mr-secondary px-3 py-2 font-mr-sans text-mr-tiny font-mr-bold tracking-mr text-mr-fg"
                            >
                                {t('profile.edit.privacy.deleteCancel')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrivacidadeTab;
