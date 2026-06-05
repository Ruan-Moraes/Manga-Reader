import { type CSSProperties, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Settings, Sparkles, User, Users, X, type LucideIcon } from 'lucide-react';

import { useMediaQuery } from '@shared/lib/useMediaQuery';

import useEnrichedProfile from '../../model/useEnrichedProfile';
import { type ProfileSettingsTab, useProfileSettingsModal } from '../../model/ProfileSettingsModalContext';
import InformacoesTab from './tabs/InformacoesTab';
import RedesTab from './tabs/RedesTab';
import RecomendacoesTab from './tabs/RecomendacoesTab';
import GruposTab from './tabs/GruposTab';
import PrivacidadeTab from './tabs/PrivacidadeTab';
import { PE } from './tabs/peShared';

type Props = {
    /** Disparado após a conta ser excluída — a camada superior trata logout/redirect. */
    onAccountDeleted?: () => void;
};

const TABS: { key: ProfileSettingsTab; labelKey: string; icon: LucideIcon }[] = [
    { key: 'informacoes', labelKey: 'profile.edit.tabs.info', icon: User },
    { key: 'redes', labelKey: 'profile.edit.tabs.social', icon: Compass },
    { key: 'recomendacoes', labelKey: 'profile.edit.tabs.recommendations', icon: Sparkles },
    { key: 'grupos', labelKey: 'profile.edit.tabs.groups', icon: Users },
    { key: 'privacidade', labelKey: 'profile.edit.tabs.privacy', icon: Settings },
];

/**
 * Modal de configurações do usuário (edição de perfil), pixel-perfect ao handoff
 * `design_handoff_profile_edit_modal/mockup/modal.jsx`. Aberto de dois pontos:
 * o botão "Editar perfil" e a opção "Configurações" do avatar. Distinto das
 * configurações de SISTEMA (página /settings).
 */
const ProfileEditModal = ({ onAccountDeleted }: Props) => {
    const { isOpen, closeProfileSettings } = useProfileSettingsModal();
    const compact = useMediaQuery('(max-width: 639px)');

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

    const overlay: CSSProperties = {
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(10,10,10,0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: compact ? 'stretch' : 'flex-start',
        justifyContent: 'center',
        padding: compact ? 0 : 'min(40px, 4vh) 12px',
        overflowY: 'auto',
    };

    const dialog: CSSProperties = {
        width: '100%',
        maxWidth: compact ? '100%' : 760,
        background: '#161616',
        border: compact ? 'none' : `1px solid ${PE.fieldBorder}`,
        borderRadius: compact ? 0 : 8,
        boxShadow: compact ? 'none' : '-0.5rem 0.5rem 0 0 rgba(221,218,42,0.25)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: compact ? '100%' : '92vh',
        overflow: 'hidden',
    };

    return (
        <div style={overlay} onClick={closeProfileSettings}>
            <div role="dialog" aria-modal="true" aria-label="Editar perfil" onClick={e => e.stopPropagation()} style={dialog}>
                <ProfileEditModalContent onAccountDeleted={onAccountDeleted} />
            </div>
        </div>
    );
};

const ProfileEditModalContent = ({ onAccountDeleted }: Props) => {
    const { t } = useTranslation('user');
    const { activeTab, setActiveTab, closeProfileSettings } = useProfileSettingsModal();
    const { profile, loading, refetch } = useEnrichedProfile();

    return (
        <>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${PE.cardBorder}` }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: PE.accent, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>{t('profile.edit.eyebrow')}</div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '.0625rem', whiteSpace: 'nowrap' }}>{t('profile.edit.title')}</h2>
                </div>
                <button
                    type="button"
                    aria-label={t('profile.edit.close')}
                    onClick={closeProfileSettings}
                    style={{ background: 'none', border: 0, color: PE.hint, cursor: 'pointer', padding: 6, minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <X size={22} />
                </button>
            </div>

            {/* tabs */}
            <div role="tablist" style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${PE.cardBorder}`, overflowX: 'auto', whiteSpace: 'nowrap', flexShrink: 0 }}>
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
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '12px 14px',
                                background: 'none',
                                border: 0,
                                borderBottom: `2px solid ${active ? PE.accent : 'transparent'}`,
                                color: active ? PE.accent : PE.hint,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                letterSpacing: '.0625rem',
                                whiteSpace: 'nowrap',
                                minHeight: 44,
                            }}
                        >
                            <Icon size={14} />
                            {t(tab.labelKey)}
                        </button>
                    );
                })}
            </div>

            {/* body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
                {loading || !profile ? (
                    <p style={{ fontSize: 12, color: PE.hint, textAlign: 'center', padding: '32px 0' }}>{t('profile.edit.loading')}</p>
                ) : (
                    <>
                        {activeTab === 'informacoes' && <InformacoesTab profile={profile} onSaved={refetch} />}
                        {activeTab === 'redes' && <RedesTab profile={profile} onSaved={refetch} />}
                        {activeTab === 'recomendacoes' && <RecomendacoesTab profile={profile} onSaved={refetch} />}
                        {activeTab === 'grupos' && <GruposTab />}
                        {activeTab === 'privacidade' && (
                            <PrivacidadeTab
                                profile={profile}
                                onAccountDeleted={() => {
                                    closeProfileSettings();
                                    onAccountDeleted?.();
                                }}
                            />
                        )}
                    </>
                )}
            </div>

            {/* footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: `1px solid ${PE.cardBorder}`, background: PE.mutedBg, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: PE.hint }}>{t('profile.edit.autosaveHint')}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={closeProfileSettings} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 16px', height: 44, borderRadius: 2, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: '.0625rem', fontFamily: 'inherit', background: PE.fieldBg, color: '#fff', border: `1px solid ${PE.tertiary}` }}>
                        {t('profile.edit.cancel')}
                    </button>
                    <button type="button" onClick={closeProfileSettings} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 16px', height: 44, borderRadius: 2, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: '.0625rem', fontFamily: 'inherit', background: PE.accent, color: '#161616', border: `1px solid ${PE.accent}` }}>
                        {t('profile.edit.save')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ProfileEditModal;
