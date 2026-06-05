import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Library, MessageSquare, type LucideIcon } from 'lucide-react';

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';

import { deleteMyAccount, updatePrivacySettings } from '../../../api/userService';
import { type EnrichedProfile, type VisibilitySetting } from '../../../model/user.types';
import { PE, peInput, peIntro } from './peShared';

const isPublic = (v?: VisibilitySetting) => v === 'PUBLIC';
const toVisibility = (on: boolean): VisibilitySetting => (on ? 'PUBLIC' : 'PRIVATE');

const PEToggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{ position: 'relative', width: 44, height: 24, padding: 0, background: checked ? PE.accent : '#333', border: `1px solid ${checked ? PE.accent : '#444'}`, borderRadius: 999, cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}
    >
        <span style={{ position: 'absolute', top: 2, left: checked ? 22 : 2, width: 18, height: 18, background: checked ? '#161616' : '#999', borderRadius: 999, transition: 'left .2s, background .2s' }} />
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
        { key: 'history', title: t('profile.edit.privacy.historyLabel'), desc: t('profile.edit.privacy.historyDesc'), icon: Library, checked: showHistory, onChange: toggleHistory },
        { key: 'comments', title: t('profile.edit.privacy.commentsLabel'), desc: t('profile.edit.privacy.commentsDesc'), icon: MessageSquare, checked: showComments, onChange: toggleComments },
    ];

    const canDelete = confirmText.trim() === profile.name && !deleting;

    return (
        <div>
            <p style={peIntro}>{t('profile.edit.privacy.intro')}</p>

            {items.map(it => {
                const Icon = it.icon;
                return (
                    <div key={it.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 14, marginBottom: 10, background: PE.cardBg, border: `1px solid ${PE.cardBorder}`, borderRadius: 4 }}>
                        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(221,218,42,0.1)', borderRadius: 2, color: PE.accent, flexShrink: 0 }}>
                            <Icon size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: PE.fg, marginBottom: 4, letterSpacing: '.0625rem' }}>{it.title}</div>
                            <div style={{ fontSize: 12, color: PE.hint, lineHeight: 1.5 }}>{it.desc}</div>
                        </div>
                        <PEToggle checked={it.checked} onChange={it.onChange} />
                    </div>
                );
            })}

            <div style={{ padding: 14, background: 'rgba(255,120,79,0.08)', border: '1px solid rgba(255,120,79,0.4)', borderRadius: 4, marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: PE.danger, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{t('profile.edit.privacy.dangerZone')}</div>
                <p style={{ fontSize: 12, color: PE.intro, lineHeight: 1.6, margin: '0 0 10px' }}>{t('profile.edit.privacy.deleteDesc')}</p>

                {!confirming ? (
                    <button type="button" onClick={() => setConfirming(true)} style={{ padding: '8px 12px', background: 'transparent', color: PE.danger, border: `1px solid ${PE.danger}`, borderRadius: 2, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.0625rem' }}>
                        {t('profile.edit.privacy.deleteAccount')}
                    </button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input
                            value={confirmText}
                            placeholder={t('profile.edit.privacy.deleteConfirmPlaceholder', { name: profile.name })}
                            onChange={e => setConfirmText(e.target.value)}
                            style={{ ...peInput, border: `1px solid ${PE.danger}` }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                type="button"
                                disabled={!canDelete}
                                onClick={confirmDelete}
                                style={{ padding: '8px 12px', background: canDelete ? PE.danger : 'transparent', color: canDelete ? '#161616' : PE.tertiary, border: `1px solid ${canDelete ? PE.danger : PE.tertiary}`, borderRadius: 2, fontSize: 11, fontWeight: 700, cursor: canDelete ? 'pointer' : 'default', fontFamily: 'inherit', letterSpacing: '.0625rem' }}
                            >
                                {t('profile.edit.privacy.deleteConfirm')}
                            </button>
                            <button type="button" onClick={() => { setConfirming(false); setConfirmText(''); }} style={{ padding: '8px 12px', background: PE.fieldBg, color: PE.fg, border: `1px solid ${PE.tertiary}`, borderRadius: 2, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.0625rem' }}>
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
