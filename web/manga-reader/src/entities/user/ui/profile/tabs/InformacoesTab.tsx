import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { Avatar } from '@ui/Avatar';
import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';

import { updateProfile, type UpdateProfilePayload } from '../../../api/userService';
import useDebouncedCallback from '../../../lib/useDebouncedCallback';
import { type EnrichedProfile } from '../../../model/user.types';
import { PE, PEField, peInput, peSmallBtn } from './peShared';

const BIO_MAX = 280;
const AUTOSAVE_MS = 1000;

type Props = { profile: EnrichedProfile; onSaved: () => void };

const InformacoesTab = ({ profile, onSaved }: Props) => {
    const { t } = useTranslation('user');
    const [name, setName] = useState(profile.name ?? '');
    const [handle, setHandle] = useState((profile.name ?? '').toLowerCase().replace(/\s+/g, ''));
    const [bio, setBio] = useState(profile.bio ?? '');
    const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? '');

    const save = useDebouncedCallback(async (payload: UpdateProfilePayload) => {
        try {
            await updateProfile(payload);
            showSuccessToast(t('profile.edit.saved'));
            onSaved();
        } catch {
            showErrorToast(t('profile.edit.saveError'));
        }
    }, AUTOSAVE_MS);

    const savePhoto = async (url: string) => {
        setPhotoUrl(url);
        try {
            await updateProfile({ photoUrl: url });
            showSuccessToast(t('profile.edit.saved'));
            onSaved();
        } catch {
            showErrorToast(t('profile.edit.saveError'));
        }
    };

    return (
        <div>
            {/* Avatar uploader card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, padding: 14, background: PE.cardBg, border: `1px solid ${PE.cardBorder}`, borderRadius: 4 }}>
                <div style={{ position: 'relative' }}>
                    <Avatar src={photoUrl || undefined} name={name} size={64} />
                    <button
                        type="button"
                        aria-label={t('profile.edit.info.photoLabel')}
                        onClick={() => {
                            const url = window.prompt(t('profile.edit.info.photoPlaceholder'), photoUrl);
                            if (url !== null) savePhoto(url);
                        }}
                        style={{ position: 'absolute', right: -4, bottom: -4, width: 24, height: 24, padding: 0, borderRadius: 2, background: PE.accent, color: '#161616', border: '2px solid #161616', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Plus size={12} />
                    </button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: PE.fg, marginBottom: 4, letterSpacing: '.0625rem' }}>{t('profile.edit.info.photoLabel')}</div>
                    <div style={{ fontSize: 11, color: PE.hint, lineHeight: 1.5 }}>{t('profile.edit.info.photoHint')}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <button
                            type="button"
                            style={peSmallBtn('ghost')}
                            onClick={() => {
                                const url = window.prompt(t('profile.edit.info.photoPlaceholder'), photoUrl);
                                if (url !== null) savePhoto(url);
                            }}
                        >
                            {t('profile.edit.info.changePhoto')}
                        </button>
                        <button type="button" style={peSmallBtn('danger')} onClick={() => savePhoto('')}>
                            {t('profile.edit.info.removePhoto')}
                        </button>
                    </div>
                </div>
            </div>

            <PEField label={t('profile.edit.info.nameLabel')}>
                <input
                    value={name}
                    maxLength={100}
                    onChange={e => {
                        setName(e.target.value);
                        save({ name: e.target.value });
                    }}
                    style={peInput}
                />
            </PEField>

            <PEField label={t('profile.edit.info.userLabel')} hint={t('profile.edit.info.userHint', { handle })}>
                <div style={{ display: 'flex', alignItems: 'center', height: 40, background: PE.fieldBg, border: `1px solid ${PE.fieldBorder}`, borderRadius: 2 }}>
                    <span style={{ padding: '0 10px', color: PE.tertiary, fontSize: 13, letterSpacing: '.0625rem' }}>mr.app/u/</span>
                    <input value={handle} onChange={e => setHandle(e.target.value)} style={{ ...peInput, height: '100%', border: 0, background: 'transparent', padding: '0 10px 0 0' }} />
                </div>
            </PEField>

            <PEField label={t('profile.edit.info.bioLabel')} hint={t('profile.edit.info.bioHint', { count: bio.length, max: BIO_MAX })}>
                <textarea
                    value={bio}
                    rows={4}
                    onChange={e => {
                        const next = e.target.value.slice(0, BIO_MAX);
                        setBio(next);
                        save({ bio: next });
                    }}
                    style={{ ...peInput, height: 'auto', padding: 10, resize: 'vertical', minHeight: 96, lineHeight: 1.5 }}
                />
            </PEField>
        </div>
    );
};

export default InformacoesTab;
