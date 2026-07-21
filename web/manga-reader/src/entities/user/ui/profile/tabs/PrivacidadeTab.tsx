import { useState, type Dispatch } from 'react';
import { useTranslation } from 'react-i18next';
import { BookMarked, Library, MessageSquare, ShieldAlert, type LucideIcon } from 'lucide-react';

import { showSuccessToast } from '@shared/service/util/toastService';

import { deleteMyAccount, updatePrivacySettings } from '../../../api/userService';
import { type AdultContentPreference, type EnrichedProfile, type VisibilitySetting } from '../../../model/user.types';
import { setAdultContentPreference as applyAdultContentPreference } from '../../../lib/adultContentPolicy';
import { cn } from '@shared/lib/cn';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { peIntro } from './peShared';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type SaveStatusChangeHandler = Dispatch<SaveStatus>;
type VisibilityChangeHandler = Dispatch<VisibilitySetting>;
type AdultContentChangeHandler = Dispatch<AdultContentPreference>;

type Props = {
    profile: EnrichedProfile;
    onAccountDeleted: () => void;
    onSaveStatusChange?: SaveStatusChangeHandler;
};

const VISIBILITY_OPTIONS: VisibilitySetting[] = ['PUBLIC', 'PRIVATE', 'DO_NOT_TRACK'];

const visibilityLabelKey: Record<VisibilitySetting, string> = {
    PUBLIC: 'public',
    PRIVATE: 'private',
    DO_NOT_TRACK: 'doNotTrack',
};

const defaultVisibility = (visibility?: VisibilitySetting) => visibility ?? 'PUBLIC';
const defaultAdultContent = (preference?: AdultContentPreference) => preference ?? 'BLUR';

const VisibilitySegment = ({ id, value, onChange }: { id: string; value: VisibilitySetting; onChange: VisibilityChangeHandler }) => {
    const { t } = useTranslation('user');

    return (
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
            {VISIBILITY_OPTIONS.map(option => {
                const selected = value === option;
                const labelKey = visibilityLabelKey[option];

                return (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={t(`profile.privacy.${labelKey}`)}
                        onClick={() => onChange(option)}
                        className={cn(
                            'mr-focus-ring min-h-[70px] cursor-pointer rounded-mr-xs border p-2.5 text-left transition-colors',
                            selected
                                ? 'border-mr-accent-border bg-mr-accent-10 text-mr-fg'
                                : 'border-mr-border bg-mr-secondary text-mr-gray-300 hover:border-mr-tertiary',
                        )}
                        data-testid={`${id}-${option}`}
                    >
                        <span className="block text-mr-tiny font-mr-extrabold uppercase tracking-mr-label">{t(`profile.privacy.${labelKey}`)}</span>
                        <span className="mt-1 block text-mr-tiny leading-snug text-mr-gray-300">{t(`profile.privacy.${labelKey}Description`)}</span>
                    </button>
                );
            })}
        </div>
    );
};

const ADULT_CONTENT_OPTIONS: AdultContentPreference[] = ['BLUR', 'HIDE', 'SHOW'];

const AdultContentSegment = ({ value, onChange }: { value: AdultContentPreference; onChange: AdultContentChangeHandler }) => {
    const { t } = useTranslation('user');

    return (
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
            {ADULT_CONTENT_OPTIONS.map(option => {
                const selected = value === option;
                const label = t(`profile.edit.privacy.adultContent.${option.toLowerCase()}`);

                return (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={label}
                        onClick={() => onChange(option)}
                        className={cn(
                            'mr-focus-ring min-h-[58px] cursor-pointer rounded-mr-xs border p-2.5 text-left transition-colors',
                            selected
                                ? 'border-mr-accent-border bg-mr-accent-10 text-mr-fg'
                                : 'border-mr-border bg-mr-secondary text-mr-gray-300 hover:border-mr-tertiary',
                        )}
                    >
                        <span className="block text-mr-tiny font-mr-extrabold uppercase tracking-mr-label">{label}</span>
                    </button>
                );
            })}
        </div>
    );
};

const PrivacidadeTab = ({ profile, onAccountDeleted, onSaveStatusChange }: Props) => {
    const { t } = useTranslation('user');
    const queryClient = useQueryClient();

    const [historyVisibility, setHistoryVisibility] = useState<VisibilitySetting>(defaultVisibility(profile.privacySettings?.viewHistoryVisibility));
    const [commentVisibility, setCommentVisibility] = useState<VisibilitySetting>(defaultVisibility(profile.privacySettings?.commentVisibility));
    const [libraryVisibility, setLibraryVisibility] = useState<VisibilitySetting>(defaultVisibility(profile.privacySettings?.libraryVisibility));
    const [adultContentPreference, setAdultContentPreference] = useState<AdultContentPreference>(
        defaultAdultContent(profile.privacySettings?.adultContentPreference),
    );
    const [behaviorAnalyticsEnabled, setBehaviorAnalyticsEnabled] = useState(profile.privacySettings?.behaviorAnalyticsEnabled ?? true);
    const [confirming, setConfirming] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    const persist = async (patch: Parameters<typeof updatePrivacySettings>[0], rollback: () => void) => {
        onSaveStatusChange?.('saving');

        try {
            const next = await updatePrivacySettings(patch);

            setCommentVisibility(next.commentVisibility);
            setHistoryVisibility(next.viewHistoryVisibility);
            setLibraryVisibility(defaultVisibility(next.libraryVisibility));
            setAdultContentPreference(defaultAdultContent(next.adultContentPreference));
            applyAdultContentPreference(next.adultContentPreference);
            if (patch.adultContentPreference) {
                queryClient.removeQueries({ queryKey: [QUERY_KEYS.TITLES] });
                queryClient.removeQueries({ queryKey: [QUERY_KEYS.TITLES_SEARCH] });
                queryClient.removeQueries({ queryKey: [QUERY_KEYS.CHAPTERS] });
            }
            setBehaviorAnalyticsEnabled(next.behaviorAnalyticsEnabled);
            onSaveStatusChange?.('saved');
            showSuccessToast(t('profile.edit.saved'));
        } catch {
            rollback();
            onSaveStatusChange?.('error');
        }
    };

    const changeHistory = (next: VisibilitySetting) => {
        if (next === historyVisibility) return;

        if (next === 'DO_NOT_TRACK' && historyVisibility !== 'DO_NOT_TRACK' && !window.confirm(t('profile.privacy.doNotTrackConfirm'))) {
            return;
        }

        const previous = historyVisibility;

        setHistoryVisibility(next);
        void persist({ viewHistoryVisibility: next }, () => setHistoryVisibility(previous));
    };

    const changeComments = (next: VisibilitySetting) => {
        if (next === commentVisibility) return;

        const previous = commentVisibility;

        setCommentVisibility(next);
        void persist({ commentVisibility: next }, () => setCommentVisibility(previous));
    };

    const changeLibrary = (next: VisibilitySetting) => {
        if (next === libraryVisibility) return;

        const previous = libraryVisibility;

        setLibraryVisibility(next);
        void persist({ libraryVisibility: next }, () => setLibraryVisibility(previous));
    };

    const changeBehaviorAnalytics = () => {
        const previous = behaviorAnalyticsEnabled;
        const next = !previous;
        setBehaviorAnalyticsEnabled(next);
        void persist({ behaviorAnalyticsEnabled: next }, () => setBehaviorAnalyticsEnabled(previous));
    };

    const changeAdultContent = (next: AdultContentPreference) => {
        if (next === adultContentPreference) return;

        const previous = adultContentPreference;

        setAdultContentPreference(next);
        void persist({ adultContentPreference: next }, () => setAdultContentPreference(previous));
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await deleteMyAccount();
            onAccountDeleted();
        } catch {
            setDeleting(false);
        }
    };

    const items: {
        key: string;
        title: string;
        desc: string;
        icon: LucideIcon;
        value: VisibilitySetting;
        onChange: VisibilityChangeHandler;
    }[] = [
        {
            key: 'history',
            title: t('profile.edit.privacy.historyLabel'),
            desc: t('profile.edit.privacy.historyDesc'),
            icon: Library,
            value: historyVisibility,
            onChange: changeHistory,
        },
        {
            key: 'comments',
            title: t('profile.edit.privacy.commentsLabel'),
            desc: t('profile.edit.privacy.commentsDesc'),
            icon: MessageSquare,
            value: commentVisibility,
            onChange: changeComments,
        },
        {
            key: 'library',
            title: t('profile.edit.privacy.libraryLabel'),
            desc: t('profile.edit.privacy.libraryDesc'),
            icon: BookMarked,
            value: libraryVisibility,
            onChange: changeLibrary,
        },
    ];

    const canDelete = confirmText.trim() === profile.name && !deleting;

    return (
        <div>
            <p className={peIntro}>{t('profile.edit.privacy.intro')}</p>

            {items.map(it => {
                const Icon = it.icon;
                return (
                    <div key={it.key} className="mb-2.5 flex items-start gap-3.5 rounded-mr-sm border border-mr-border bg-mr-surface-interactive p-3.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-mr-xs bg-mr-accent-10 text-mr-accent-fg">
                            <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 text-[13px] font-mr-bold tracking-mr text-mr-fg">{it.title}</div>
                            <div className="mb-3 text-mr-small leading-normal text-mr-gray-300">{it.desc}</div>
                            <VisibilitySegment id={it.key} value={it.value} onChange={it.onChange} />
                        </div>
                    </div>
                );
            })}

            <div className="mb-2.5 flex items-start gap-3.5 rounded-mr-sm border border-mr-border bg-mr-surface-interactive p-3.5">
                <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[13px] font-mr-bold tracking-mr text-mr-fg">{t('profile.edit.privacy.analyticsLabel')}</div>
                    <div className="text-mr-small leading-normal text-mr-gray-300">{t('profile.edit.privacy.analyticsDesc')}</div>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={behaviorAnalyticsEnabled}
                    disabled={historyVisibility === 'DO_NOT_TRACK'}
                    onClick={changeBehaviorAnalytics}
                    className={cn(
                        'mr-focus-ring cursor-pointer rounded-mr-full px-3 py-2 text-mr-tiny font-mr-bold disabled:cursor-not-allowed disabled:opacity-mr-disabled',
                        behaviorAnalyticsEnabled ? 'bg-mr-accent text-mr-on-accent' : 'bg-mr-secondary text-mr-gray-300',
                    )}
                >
                    {t(behaviorAnalyticsEnabled ? 'profile.edit.privacy.analyticsOn' : 'profile.edit.privacy.analyticsOff')}
                </button>
            </div>

            <div className="mb-2.5 flex items-start gap-3.5 rounded-mr-sm border border-mr-border bg-mr-surface-interactive p-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-mr-xs bg-mr-accent-10 text-mr-accent-fg">
                    <ShieldAlert size={18} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[13px] font-mr-bold tracking-mr text-mr-fg">{t('profile.edit.privacy.adultContentLabel')}</div>
                    <div className="mb-3 text-mr-small leading-normal text-mr-gray-300">{t('profile.edit.privacy.adultContentDesc')}</div>
                    <AdultContentSegment value={adultContentPreference} onChange={changeAdultContent} />
                </div>
            </div>

            <div className="mt-3.5 rounded-mr-sm border border-mr-danger-border bg-mr-danger-15 p-3.5">
                <div className="mb-1.5 text-mr-tiny font-mr-extrabold uppercase tracking-mr-label text-mr-danger">{t('profile.edit.privacy.dangerZone')}</div>
                <p className="mb-2.5 text-mr-small leading-relaxed text-mr-gray-200">{t('profile.edit.privacy.deleteDesc')}</p>
                <ul className="mb-3 list-disc space-y-1 pl-4 text-mr-tiny leading-relaxed text-mr-gray-300">
                    <li>{t('profile.edit.privacy.deleteImpact.profile')}</li>
                    <li>{t('profile.edit.privacy.deleteImpact.activity')}</li>
                    <li>{t('profile.edit.privacy.deleteImpact.access')}</li>
                </ul>

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
                                        ? 'mr-focus-ring cursor-pointer border-mr-danger bg-mr-danger text-mr-on-accent'
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
