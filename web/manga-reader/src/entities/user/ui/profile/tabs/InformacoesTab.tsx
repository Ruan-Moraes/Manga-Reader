import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import useDebouncedCallback from '../../../lib/useDebouncedCallback';

import { Avatar } from '@ui/Avatar';

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';

import { updateProfile, type UpdateProfilePayload } from '@entities/user';
import { type EnrichedProfile } from '@entities/user';

import { FavoriteGenresField } from './FavoriteGenresField';
import { PEField, peInput, peSmallBtn } from './peShared';

const BIO_MAX = 280;
const AUTOSAVE_MS = 1000;

type Props = { profile: EnrichedProfile; onSaved: () => void };

const InformacoesTab = ({ profile, onSaved }: Props) => {
    const { t } = useTranslation('user');

    const [name, setName] = useState(profile.name ?? '');
    const [handle, setHandle] = useState(profile.username ?? (profile.name ?? '').toLowerCase().replace(/\s+/g, '_'));
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

    // Username (DT-48): 409 = handle já em uso — mensagem específica.
    const saveUsername = useDebouncedCallback(async (value: string) => {
        try {
            await updateProfile({ username: value });

            showSuccessToast(t('profile.edit.saved'));

            onSaved();
        } catch (error) {
            const status = (error as { response?: { status?: number } }).response?.status;

            showErrorToast(status === 409 ? t('profile.edit.info.userTaken') : t('profile.edit.saveError'));
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
            <div className="mb-[18px] flex items-center gap-3.5 rounded-mr-sm border border-[#333333] bg-[#1f1f20] p-3.5">
                <div className="relative">
                    <Avatar src={photoUrl || undefined} name={name} size={64} />
                    <button
                        type="button"
                        aria-label={t('profile.edit.info.photoLabel')}
                        onClick={() => {
                            const url = window.prompt(t('profile.edit.info.photoPlaceholder'), photoUrl);

                            if (url !== null) savePhoto(url);
                        }}
                        className="mr-focus-ring absolute -bottom-1 -right-1 flex size-6 cursor-pointer items-center justify-center rounded-mr-xs border-2 border-mr-primary bg-mr-accent p-0 text-mr-primary"
                    >
                        <Plus size={12} />
                    </button>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[13px] font-mr-bold tracking-mr text-mr-fg">{t('profile.edit.info.photoLabel')}</div>
                    <div className="text-mr-tiny leading-normal text-mr-gray-300">{t('profile.edit.info.photoHint')}</div>
                    <div className="mt-2 flex gap-1.5">
                        <button
                            type="button"
                            className={peSmallBtn('ghost')}
                            onClick={() => {
                                const url = window.prompt(t('profile.edit.info.photoPlaceholder'), photoUrl);

                                if (url !== null) savePhoto(url);
                            }}
                        >
                            {t('profile.edit.info.changePhoto')}
                        </button>
                        <button type="button" className={peSmallBtn('danger')} onClick={() => savePhoto('')}>
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
                    className={peInput}
                />
            </PEField>

            <PEField label={t('profile.edit.info.userLabel')} hint={t('profile.edit.info.userHint', { handle })}>
                <div className="flex h-10 items-center rounded-mr-xs border border-mr-gray-700 bg-mr-secondary">
                    <span className="pl-2.5 text-[13px] tracking-mr text-mr-tertiary whitespace-nowrap">mr.app/u/</span>
                    <input
                        value={handle}
                        maxLength={30}
                        onChange={e => {
                            // Espelha a validação do backend: [a-z0-9_], 3–30.
                            const next = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);

                            setHandle(next);

                            if (next.length >= 3) saveUsername(next);
                        }}
                        className="h-full w-full border-0 bg-transparent pl-0 pr-2.5 font-mr-sans text-[13px] tracking-mr text-mr-fg outline-none"
                    />
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
                    className="box-border min-h-24 w-full resize-y rounded-mr-xs border border-mr-gray-700 bg-mr-secondary p-2.5 font-mr-sans text-[13px] leading-normal tracking-mr text-mr-fg outline-none"
                />
            </PEField>

            <FavoriteGenresField initialGenres={profile.favoriteGenres ?? []} onSaved={onSaved} />
        </div>
    );
};

export default InformacoesTab;
