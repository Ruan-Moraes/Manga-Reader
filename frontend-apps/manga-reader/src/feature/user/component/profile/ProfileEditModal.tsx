import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    type EnrichedProfile,
    type SocialLinkResponse,
} from '../../type/user.types';
import { showSuccessToast } from '@shared/service/util/toastService';

type Props = {
    profile: EnrichedProfile;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: {
        name: string;
        bio: string;
        photoUrl: string;
        bannerUrl: string;
        socialLinks: { platform: string; url: string }[];
    }) => Promise<void>;
};

const ProfileEditModal = ({ profile, isOpen, onClose, onSave }: Props) => {
    const { t } = useTranslation('user');
    const [name, setName] = useState(profile.name);
    const [bio, setBio] = useState(profile.bio ?? '');
    const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? '');
    const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? '');
    const [socialLinks, setSocialLinks] = useState<
        { platform: string; url: string }[]
    >(
        profile.socialLinks.map((sl: SocialLinkResponse) => ({
            platform: sl.platform,
            url: sl.url,
        })),
    );
    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleAddLink = () => {
        setSocialLinks([...socialLinks, { platform: '', url: '' }]);
    };

    const handleRemoveLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const handleLinkChange = (
        index: number,
        field: 'platform' | 'url',
        value: string,
    ) => {
        const updated = [...socialLinks];
        updated[index] = { ...updated[index], [field]: value };
        setSocialLinks(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave({ name, bio, photoUrl, bannerUrl, socialLinks });
            showSuccessToast(t('profile.edit.savedMessage'));
            onClose();
        } catch {
            // handled by interceptor
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-primary-default border border-tertiary rounded-xs p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">
                        {t('profile.edit.title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-tertiary hover:text-primary-default"
                    >
                        X
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <label className="text-sm">
                        {t('profile.edit.nameLabel')}
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-2 py-2 mt-1 text-sm border rounded-xs border-tertiary bg-primary-default"
                            required
                            minLength={2}
                            maxLength={100}
                        />
                    </label>

                    <label className="text-sm">
                        {t('profile.edit.bioLabel')}
                        <textarea
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            maxLength={500}
                            className="w-full h-20 px-2 py-2 mt-1 text-sm border rounded-xs border-tertiary bg-primary-default"
                        />
                        <span className="text-[10px] text-tertiary">
                            {bio.length}/500
                        </span>
                    </label>

                    <label className="text-sm">
                        {t('profile.edit.photoUrlLabel')}
                        <input
                            value={photoUrl}
                            onChange={e => setPhotoUrl(e.target.value)}
                            className="w-full px-2 py-2 mt-1 text-sm border rounded-xs border-tertiary bg-primary-default"
                        />
                    </label>

                    <label className="text-sm">
                        {t('profile.edit.bannerUrlLabel')}
                        <input
                            value={bannerUrl}
                            onChange={e => setBannerUrl(e.target.value)}
                            className="w-full px-2 py-2 mt-1 text-sm border rounded-xs border-tertiary bg-primary-default"
                        />
                    </label>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                                {t('profile.edit.socialLinksLabel')}
                            </span>
                            <button
                                type="button"
                                onClick={handleAddLink}
                                className="text-xs text-quaternary hover:underline"
                            >
                                {t('profile.edit.addLink')}
                            </button>
                        </div>
                        {socialLinks.map((link, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                                <input
                                    value={link.platform}
                                    onChange={e =>
                                        handleLinkChange(
                                            i,
                                            'platform',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'profile.edit.platformPlaceholder',
                                    )}
                                    className="flex-1 px-2 py-1.5 text-xs border rounded-xs border-tertiary bg-primary-default"
                                />
                                <input
                                    value={link.url}
                                    onChange={e =>
                                        handleLinkChange(
                                            i,
                                            'url',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'profile.edit.urlPlaceholder',
                                    )}
                                    className="flex-[2] px-2 py-1.5 text-xs border rounded-xs border-tertiary bg-primary-default"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLink(i)}
                                    className="text-xs text-quinary-default"
                                >
                                    X
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="px-3 py-2 text-sm font-semibold border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors disabled:opacity-50"
                    >
                        {saving
                            ? t('profile.edit.saving')
                            : t('profile.edit.save')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileEditModal;
