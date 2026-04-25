import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { type ViewHistoryItem } from '../../type/user.types';
import { getUserHistory } from '../../service/userService';
import ProfileEmptyState from './ProfileEmptyState';
import PrivacyBadge from './PrivacyBadge';

type Props = {
    userId: string;
    isOwner: boolean;
    viewHistoryVisibility: string;
};

const ViewHistorySection = ({
    userId,
    isOwner,
    viewHistoryVisibility,
}: Props) => {
    const { t, i18n } = useTranslation('user');
    const [items, setItems] = useState<ViewHistoryItem[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getUserHistory(userId, page);
            setItems(data.content);
            setTotalPages(data.totalPages);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [userId, page]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    if (loading) {
        return (
            <div className="px-4 py-3 animate-pulse">
                <div className="h-20 bg-tertiary/20 rounded-xs" />
            </div>
        );
    }

    return (
        <div className="px-4 py-3 space-y-3">
            {isOwner && viewHistoryVisibility !== 'PUBLIC' && (
                <PrivacyBadge visibility={viewHistoryVisibility} />
            )}

            {items.length === 0 ? (
                <ProfileEmptyState message={t('profile.history.empty')} />
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {items.map(item => (
                        <Link
                            key={`${item.titleId}-${item.viewedAt}`}
                            to={`/Manga-Reader/title/${item.titleId}`}
                            className="block overflow-hidden border rounded-xs border-tertiary"
                        >
                            {item.titleCover ? (
                                <img
                                    src={item.titleCover}
                                    alt={item.titleName}
                                    className="object-cover w-full h-36"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-36 bg-secondary/50">
                                    <span className="text-xs text-tertiary">
                                        {t('profile.history.noCover')}
                                    </span>
                                </div>
                            )}
                            <div className="p-1.5">
                                <p className="text-xs truncate">
                                    {item.titleName}
                                </p>
                                {item.viewedAt && (
                                    <p className="text-[10px] text-tertiary">
                                        {new Date(
                                            item.viewedAt,
                                        ).toLocaleDateString(i18n.language)}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-2 py-1 text-xs border rounded-xs border-tertiary disabled:opacity-30"
                    >
                        {t('profile.history.previous')}
                    </button>
                    <span className="text-xs text-tertiary self-center">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= totalPages - 1}
                        className="px-2 py-1 text-xs border rounded-xs border-tertiary disabled:opacity-30"
                    >
                        {t('profile.history.next')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ViewHistorySection;
