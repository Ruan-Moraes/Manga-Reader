import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';

import { updateProfile } from '../../../api/userService';
import useDebouncedCallback from '../../../lib/useDebouncedCallback';
import { type EnrichedProfile } from '../../../model/user.types';
import { PE, PEField, peInput, peIntro } from './peShared';

const AUTOSAVE_MS = 1000;

const FIELDS: { key: string; label: string; prefix: string; placeholder: string }[] = [
    { key: 'twitter', label: 'Twitter / X', prefix: '@', placeholder: 'usuario' },
    { key: 'instagram', label: 'Instagram', prefix: '@', placeholder: 'usuario' },
    { key: 'myanimelist', label: 'MyAnimeList', prefix: 'myanimelist.net/profile/', placeholder: 'usuario' },
    { key: 'github', label: 'GitHub', prefix: 'github.com/', placeholder: 'usuario' },
];

const stripPrefix = (url: string, prefix: string) => (url.startsWith(prefix) ? url.slice(prefix.length) : url);

type Props = { profile: EnrichedProfile; onSaved: () => void };

const RedesTab = ({ profile, onSaved }: Props) => {
    const { t } = useTranslation('user');

    const [handles, setHandles] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        for (const { key, prefix } of FIELDS) {
            const link = profile.socialLinks.find(sl => sl.platform === key);
            initial[key] = link ? stripPrefix(link.url, prefix) : '';
        }
        return initial;
    });

    const save = useDebouncedCallback(async (next: Record<string, string>) => {
        const socialLinks = FIELDS.filter(f => next[f.key]?.trim()).map(f => ({ platform: f.key, url: `${f.prefix}${next[f.key].trim()}` }));
        try {
            await updateProfile({ socialLinks });
            showSuccessToast(t('profile.edit.saved'));
            onSaved();
        } catch {
            showErrorToast(t('profile.edit.saveError'));
        }
    }, AUTOSAVE_MS);

    const onChange = (key: string, value: string) => {
        const next = { ...handles, [key]: value };
        setHandles(next);
        save(next);
    };

    return (
        <div>
            <p style={peIntro}>{t('profile.edit.social.intro')}</p>
            {FIELDS.map(f => (
                <PEField key={f.key} label={f.label}>
                    <div style={{ display: 'flex', alignItems: 'center', height: 40, background: PE.fieldBg, border: `1px solid ${PE.fieldBorder}`, borderRadius: 2 }}>
                        <span style={{ padding: '0 10px', color: PE.tertiary, fontSize: 12, letterSpacing: '.0625rem', borderRight: `1px solid ${PE.fieldBorder}`, height: '100%', display: 'flex', alignItems: 'center' }}>{f.prefix}</span>
                        <input
                            value={handles[f.key] || ''}
                            placeholder={f.placeholder}
                            onChange={e => onChange(f.key, e.target.value)}
                            style={{ ...peInput, height: '100%', border: 0, background: 'transparent', padding: '0 12px' }}
                        />
                    </div>
                </PEField>
            ))}
        </div>
    );
};

export default RedesTab;
