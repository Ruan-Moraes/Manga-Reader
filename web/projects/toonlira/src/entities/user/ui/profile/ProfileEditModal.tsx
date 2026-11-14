import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Settings, Sparkles, User, Users, X, type LucideIcon } from 'lucide-react';

import { type ProfileSettingsTab, useProfileSettingsModal } from '@entities/user';

import useEnrichedProfile from '../../model/useEnrichedProfile';

import InformacoesTab from './tabs/InformacoesTab';
import RedesTab from './tabs/RedesTab';
import RecomendacoesTab from './tabs/RecomendacoesTab';
import GruposTab from './tabs/GruposTab';
import PrivacidadeTab from './tabs/PrivacidadeTab';

type Props = {
    onAccountDeleted?: () => void;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const TABS: { key: ProfileSettingsTab; labelKey: string; icon: LucideIcon }[] = [
    { key: 'informacoes', labelKey: 'profile.edit.tabs.info', icon: User },
    { key: 'redes', labelKey: 'profile.edit.tabs.social', icon: Compass },
    { key: 'recomendacoes', labelKey: 'profile.edit.tabs.recommendations', icon: Sparkles },
    { key: 'grupos', labelKey: 'profile.edit.tabs.groups', icon: Users },
    { key: 'privacidade', labelKey: 'profile.edit.tabs.privacy', icon: Settings },
];

const ProfileEditModal = ({ onAccountDeleted }: Props) => {
    const { isOpen, closeProfileSettings } = useProfileSettingsModal();

    useEffect(() => {
        if (!isOpen) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeProfileSettings();
        };

        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, closeProfileSettings]);

    if (!isOpen) return null;

    return (
        <div
            onClick={closeProfileSettings}
            className="fixed inset-0 z-ui-modal flex items-stretch justify-center overflow-y-auto bg-ui-overlay p-0 backdrop-blur-[6px] sm:items-start sm:px-3 sm:py-[min(40px,4vh)]"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Editar perfil"
                onClick={e => e.stopPropagation()}
                className="flex max-h-full w-full max-w-full flex-col overflow-hidden rounded-none border-0 bg-ui-primary sm:max-h-[92vh] sm:max-w-[760px] sm:rounded-ui-xs sm:border sm:border-ui-gray-700 sm:shadow-[-0.5rem_0.5rem_0_0_var(--ui-accent-25)]"
            >
                <ProfileEditModalContent onAccountDeleted={onAccountDeleted} />
            </div>
        </div>
    );
};

const ProfileEditModalContent = ({ onAccountDeleted }: Props) => {
    const { t } = useTranslation('user');

    const { activeTab, setActiveTab, closeProfileSettings } = useProfileSettingsModal();
    const { profile, loading, refetch } = useEnrichedProfile();
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

    const statusLabel =
        saveStatus === 'saving'
            ? t('profile.edit.status.saving')
            : saveStatus === 'saved'
              ? t('profile.edit.status.saved')
              : saveStatus === 'error'
                ? t('profile.edit.status.error')
                : t('profile.edit.autosaveHint');

    return (
        <>
            <div className="flex items-center justify-between border-b border-ui-border px-5 py-4">
                <div className="min-w-0">
                    <div className="mb-0.5 text-ui-tiny font-ui-extrabold uppercase tracking-[.1em] text-ui-accent-fg">{t('profile.edit.eyebrow')}</div>
                    <h2 className="whitespace-nowrap text-[18px] font-ui-bold tracking-mr text-ui-fg">{t('profile.edit.title')}</h2>
                </div>
                <button
                    type="button"
                    aria-label={t('profile.edit.close')}
                    onClick={closeProfileSettings}
                    className="ui-focus-ring flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-0 bg-transparent p-1.5 text-ui-gray-300 hover:text-ui-fg"
                >
                    <X size={22} />
                </button>
            </div>

            <div role="tablist" className="flex shrink-0 overflow-x-auto whitespace-nowrap border-b border-ui-border">
                {TABS.map(tab => {
                    const Icon = tab.icon;

                    const active = activeTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setActiveTab(tab.key)}
                            className={`ui-focus-ring inline-flex min-h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap border-0 border-b-2 bg-transparent px-3.5 py-3 font-ui-sans text-ui-small font-ui-bold tracking-mr ${active ? 'border-ui-accent-border text-ui-accent-fg' : 'border-transparent text-ui-gray-300'}`}
                        >
                            <Icon size={14} />
                            {t(tab.labelKey)}
                        </button>
                    );
                })}
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-5 py-[18px]">
                {loading || !profile ? (
                    <p className="py-8 text-center text-ui-small text-ui-gray-300">{t('profile.edit.loading')}</p>
                ) : (
                    <>
                        {activeTab === 'informacoes' && <InformacoesTab profile={profile} onSaved={refetch} />}
                        {activeTab === 'redes' && <RedesTab profile={profile} onSaved={refetch} />}
                        {activeTab === 'recomendacoes' && <RecomendacoesTab profile={profile} onSaved={refetch} />}
                        {activeTab === 'grupos' && <GruposTab />}
                        {activeTab === 'privacidade' && (
                            <PrivacidadeTab
                                profile={profile}
                                onSaveStatusChange={setSaveStatus}
                                onAccountDeleted={() => {
                                    closeProfileSettings();
                                    onAccountDeleted?.();
                                }}
                            />
                        )}
                    </>
                )}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2.5 border-t border-ui-border bg-ui-gray-900 px-5 py-3.5">
                <span className="text-ui-tiny text-ui-gray-300" role="status">
                    {statusLabel}
                </span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={closeProfileSettings}
                        className="ui-focus-ring inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-ui-xs border border-ui-tertiary bg-ui-secondary px-4 font-ui-sans text-ui-body font-ui-bold tracking-mr text-ui-fg"
                    >
                        {t('profile.edit.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={closeProfileSettings}
                        className="ui-focus-ring inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-ui-xs border border-ui-accent-border bg-ui-accent px-4 font-ui-sans text-ui-body font-ui-bold tracking-mr text-ui-on-accent"
                    >
                        {t('profile.edit.save')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ProfileEditModal;
