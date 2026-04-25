import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { type RecommendedTitle } from '../../type/user.types';
import {
    addRecommendation,
    removeRecommendation,
} from '../../service/userService';
import ProfileEmptyState from './ProfileEmptyState';

type Props = {
    recommendations: RecommendedTitle[];
    isOwner: boolean;
    onUpdate: () => void;
};

const RecommendationsSection = ({
    recommendations,
    isOwner,
    onUpdate,
}: Props) => {
    const { t } = useTranslation('user');
    const [titleIdInput, setTitleIdInput] = useState('');
    const [adding, setAdding] = useState(false);

    const handleAdd = async () => {
        if (!titleIdInput.trim()) return;
        setAdding(true);
        try {
            await addRecommendation(titleIdInput.trim());
            setTitleIdInput('');
            onUpdate();
        } catch {
            // error handled by interceptor
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (titleId: string) => {
        try {
            await removeRecommendation(titleId);
            onUpdate();
        } catch {
            // error handled by interceptor
        }
    };

    if (recommendations.length === 0 && !isOwner) {
        return (
            <ProfileEmptyState
                message={t('profile.recommendations.empty')}
            />
        );
    }

    return (
        <div className="px-4 py-3 space-y-4">
            {isOwner && recommendations.length < 10 && (
                <div className="flex gap-2">
                    <input
                        value={titleIdInput}
                        onChange={e => setTitleIdInput(e.target.value)}
                        placeholder={t('profile.recommendations.addPlaceholder')}
                        className="flex-1 px-2 py-1.5 text-sm border rounded-xs border-tertiary bg-primary-default"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={adding}
                        className="px-3 py-1.5 text-xs font-medium border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors disabled:opacity-50"
                    >
                        {adding
                            ? t('profile.recommendations.adding')
                            : t('profile.recommendations.add')}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {recommendations.map(rec => (
                    <div key={rec.titleId} className="relative group">
                        <Link
                            to={`/Manga-Reader/title/${rec.titleId}`}
                            className="block overflow-hidden border rounded-xs border-tertiary"
                        >
                            {rec.titleCover ? (
                                <img
                                    src={rec.titleCover}
                                    alt={rec.titleName}
                                    className="object-cover w-full h-40"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-40 bg-secondary/50">
                                    <span className="text-xs text-tertiary">
                                        {t('profile.recommendations.noCover')}
                                    </span>
                                </div>
                            )}
                            <p className="p-1.5 text-xs truncate">
                                {rec.titleName}
                            </p>
                        </Link>
                        {isOwner && (
                            <button
                                onClick={() => handleRemove(rec.titleId)}
                                className="absolute top-1 right-1 px-1.5 py-0.5 text-xs bg-quinary-default/80 text-white rounded-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                X
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {recommendations.length === 0 && isOwner && (
                <ProfileEmptyState
                    message={t('profile.recommendations.emptyOwner')}
                />
            )}
        </div>
    );
};

export default RecommendationsSection;
