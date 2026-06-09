import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';

import { updateProfile } from '../../../api/userService';
import useDebouncedCallback from '../../../lib/useDebouncedCallback';
import { type EnrichedProfile } from '../../../model/user.types';
import { PEField, peInputBare, peIntro } from './peShared';

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
            <p className={peIntro}>{t('profile.edit.social.intro')}</p>
            {FIELDS.map(f => (
                <PEField key={f.key} label={f.label}>
                    <div className="flex h-10 items-center rounded-mr-xs border border-mr-gray-700 bg-mr-secondary">
                        <span className="flex h-full items-center border-r border-mr-gray-700 px-2.5 text-mr-small tracking-mr text-mr-tertiary">
                            {f.prefix}
                        </span>
                        <input
                            value={handles[f.key] || ''}
                            placeholder={f.placeholder}
                            onChange={e => onChange(f.key, e.target.value)}
                            className={peInputBare}
                        />
                    </div>
                </PEField>
            ))}
        </div>
    );
};

export default RedesTab;
