import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

import { showSuccessToast } from '@shared/service/util/toastService';

import { removeRecommendation } from '../../../api/userService';
import { type EnrichedProfile, type RecommendedTitle } from '../../../model/user.types';

const MAX = 6;

type Props = { profile: EnrichedProfile; onSaved: () => void };

const RecomendacoesTab = ({ profile, onSaved }: Props) => {
    const { t } = useTranslation('user');
    const [items, setItems] = useState<RecommendedTitle[]>(profile.recommendations ?? []);

    const removeMany = async (ids: string[], rollback: RecommendedTitle[]) => {
        try {
            await Promise.all(ids.map(id => removeRecommendation(id)));
            showSuccessToast(t('profile.edit.saved'));
            onSaved();
        } catch {
            setItems(rollback);
        }
    };

    const toggleOff = (titleId: string) => {
        const previous = items;
        setItems(prev => prev.filter(r => r.titleId !== titleId));
        removeMany([titleId], previous);
    };

    const clearAll = () => {
        const previous = items;
        setItems([]);
        removeMany(
            previous.map(r => r.titleId),
            previous,
        );
    };

    return (
        <div>
            <p className="mb-3.5 text-mr-small leading-relaxed text-mr-gray-200">{t('profile.edit.recommendations.intro')}</p>

            <div className="mb-3 flex items-center justify-between rounded-mr-xs border border-mr-border bg-mr-surface-interactive px-3 py-2">
                <span className="text-mr-small font-mr-bold text-mr-fg">{t('profile.edit.recommendations.counter', { count: items.length, max: MAX })}</span>
                {items.length > 0 && (
                    <button
                        type="button"
                        onClick={clearAll}
                        className="mr-focus-ring cursor-pointer border-0 bg-transparent p-0 font-mr-sans text-mr-tiny font-mr-bold tracking-mr text-mr-danger"
                    >
                        {t('profile.edit.recommendations.clear')}
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <p className="py-6 text-center text-mr-small text-mr-gray-300">{t('profile.edit.recommendations.empty')}</p>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2.5">
                    {items.map(rec => (
                        <button
                            key={rec.titleId}
                            type="button"
                            onClick={() => toggleOff(rec.titleId)}
                            aria-label={t('profile.edit.recommendations.remove')}
                            className="mr-focus-ring relative aspect-[2/3] cursor-pointer overflow-hidden rounded-mr-sm border border-mr-accent-border bg-[var(--mr-poster-gradient)] p-0 shadow-[-0.25rem_0.25rem_0_0_var(--mr-accent-25)] transition-all duration-200"
                        >
                            {rec.titleCover ? (
                                <img src={rec.titleCover} alt={rec.titleName} className="absolute inset-0 size-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[clamp(20px,5vw,32px)] font-mr-extrabold text-mr-accent/40">
                                    {rec.titleName?.charAt(0) ?? '?'}
                                </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-[55%] bg-mr-image-gradient" />
                            <div className="absolute inset-x-1.5 bottom-1.5 line-clamp-2 text-left text-[10px] font-mr-bold leading-tight tracking-[.05em] text-mr-on-overlay [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
                                {rec.titleName}
                            </div>
                            <div className="absolute right-1.5 top-1.5 flex size-[22px] items-center justify-center rounded-mr-xs bg-mr-accent text-mr-on-accent">
                                <Check size={14} />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecomendacoesTab;
