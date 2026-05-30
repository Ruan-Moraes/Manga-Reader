import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { Select } from '@ui/Select';
import { SegmentedControl } from '@ui/SegmentedControl';
import { SearchField } from '@ui/SearchField';
import { ChapterListItem } from '@ui/ChapterListItem';
import { Pagination } from '@ui/Pagination';
import { EmptyState } from '@ui/EmptyState';

import type { Chapter } from '@feature/chapter';

type ChaptersTabProps = {
    titleId: string;
    chapters: Chapter[];
    totalPages: number;
    isLoading: boolean;
    lang: string;
    onLangChange: (v: string) => void;
    order: 'asc' | 'desc';
    onOrderChange: (v: 'asc' | 'desc') => void;
    search: string;
    onSearchChange: (v: string) => void;
    page: number;
    onPageChange: (p: number) => void;
};

const ChaptersTab = ({
    titleId,
    chapters,
    totalPages,
    isLoading,
    lang,
    onLangChange,
    order,
    onOrderChange,
    search,
    onSearchChange,
    page,
    onPageChange,
}: ChaptersTabProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('manga');

    const langOptions = [
        { value: 'all', label: t('titleDetails.lang.all') },
        { value: 'pt-BR', label: t('titleDetails.lang.ptBR') },
        { value: 'en', label: t('titleDetails.lang.en') },
    ];
    const orderItems = [
        { value: 'desc', label: t('titleDetails.order.desc') },
        { value: 'asc', label: t('titleDetails.order.asc') },
    ];

    const filtered = chapters.filter(c => !search || c.number.includes(search) || c.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <>
            <div className="mb-4 flex flex-wrap gap-3">
                <Select value={lang} onChange={e => onLangChange(e.target.value)} options={langOptions} className="w-44" />
                <SegmentedControl items={orderItems} value={order} onChange={v => onOrderChange(v as 'asc' | 'desc')} size="sm" />
                <SearchField value={search} onChange={onSearchChange} placeholder={t('chapter.searchPlaceholder')} className="flex-1 min-w-[180px]" />
            </div>

            {isLoading ? (
                <div className="flex flex-col gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-16 animate-pulse rounded bg-mr-tertiary/20" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState illustration="pensando" title={t('titleDetails.noChapters')} />
            ) : (
                <div className="flex flex-col gap-1">
                    {filtered.map(c => (
                        <ChapterListItem
                            key={c.number}
                            number={Number(c.number)}
                            title={c.title}
                            publishedAt={c.releaseDate}
                            onClick={() => navigate(`/titles/${titleId}/chapters/${c.number}`)}
                        />
                    ))}
                </div>
            )}

            <div className="mt-6">
                <Pagination page={page + 1} total={totalPages} onChange={p => onPageChange(p - 1)} />
            </div>
        </>
    );
};

export default ChaptersTab;
