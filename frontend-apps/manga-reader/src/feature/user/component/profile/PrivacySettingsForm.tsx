import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    type PrivacySettings,
    type VisibilitySetting,
} from '../../type/user.types';
import { updatePrivacySettings } from '../../service/userService';
import { showSuccessToast } from '@shared/service/util/toastService';

type Props = {
    privacySettings: PrivacySettings;
    onUpdate: () => void;
};

const OPTIONS: {
    value: VisibilitySetting;
    labelKey: string;
    descriptionKey: string;
}[] = [
    {
        value: 'PUBLIC',
        labelKey: 'public',
        descriptionKey: 'publicDescription',
    },
    {
        value: 'PRIVATE',
        labelKey: 'private',
        descriptionKey: 'privateDescription',
    },
    {
        value: 'DO_NOT_TRACK',
        labelKey: 'doNotTrack',
        descriptionKey: 'doNotTrackDescription',
    },
];

const PrivacySettingsForm = ({ privacySettings, onUpdate }: Props) => {
    const { t } = useTranslation('user');

    const [commentVis, setCommentVis] = useState<VisibilitySetting>(
        privacySettings.commentVisibility,
    );
    const [historyVis, setHistoryVis] = useState<VisibilitySetting>(
        privacySettings.viewHistoryVisibility,
    );
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (
            historyVis === 'DO_NOT_TRACK' &&
            privacySettings.viewHistoryVisibility !== 'DO_NOT_TRACK'
        ) {
            const confirmed = window.confirm(
                t('profile.privacy.doNotTrackConfirm'),
            );
            if (!confirmed) return;
        }

        setSaving(true);
        try {
            await updatePrivacySettings({
                commentVisibility: commentVis,
                viewHistoryVisibility: historyVis,
            });
            showSuccessToast(t('profile.privacy.savedMessage'));
            onUpdate();
        } catch {
            // handled by interceptor
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="px-4 py-3 space-y-6">
            <div>
                <h3 className="text-sm font-semibold mb-3">
                    {t('profile.privacy.commentVisibility')}
                </h3>
                <div className="space-y-2">
                    {OPTIONS.filter(o => o.value !== 'DO_NOT_TRACK').map(
                        opt => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name="commentVis"
                                    value={opt.value}
                                    checked={commentVis === opt.value}
                                    onChange={() => setCommentVis(opt.value)}
                                    className="accent-quaternary"
                                />
                                <div>
                                    <span className="text-sm">
                                        {t(
                                            `profile.privacy.${opt.labelKey}`,
                                        )}
                                    </span>
                                    <p className="text-[10px] text-tertiary">
                                        {t(
                                            `profile.privacy.${opt.descriptionKey}`,
                                        )}
                                    </p>
                                </div>
                            </label>
                        ),
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold mb-3">
                    {t('profile.privacy.historyVisibility')}
                </h3>
                <div className="space-y-2">
                    {OPTIONS.map(opt => (
                        <label
                            key={opt.value}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <input
                                type="radio"
                                name="historyVis"
                                value={opt.value}
                                checked={historyVis === opt.value}
                                onChange={() => setHistoryVis(opt.value)}
                                className="accent-quaternary"
                            />
                            <div>
                                <span className="text-sm">
                                    {t(`profile.privacy.${opt.labelKey}`)}
                                </span>
                                <p className="text-[10px] text-tertiary">
                                    {t(
                                        `profile.privacy.${opt.descriptionKey}`,
                                    )}
                                </p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors disabled:opacity-50"
            >
                {saving
                    ? t('profile.privacy.saving')
                    : t('profile.privacy.save')}
            </button>
        </div>
    );
};

export default PrivacySettingsForm;
