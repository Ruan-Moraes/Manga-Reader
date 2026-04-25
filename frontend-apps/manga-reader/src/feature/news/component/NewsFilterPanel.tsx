import { useTranslation } from 'react-i18next';

import BaseSelect from '@shared/component/input/BaseSelect';

type NewsFilterPanelProps = {
    period: 'all' | 'today' | 'week' | 'month';
    setPeriod: (value: 'all' | 'today' | 'week' | 'month') => void;
    source: string;
    setSource: (value: string) => void;
    sort: 'recent' | 'most-read' | 'trending';
    setSort: (value: 'recent' | 'most-read' | 'trending') => void;
    sources: readonly string[];
};

const filterSelectClass =
    'w-full px-3 py-2 border rounded-xs border-tertiary bg-secondary';

const NewsFilterPanel = ({
    period,
    setPeriod,
    source,
    setSource,
    sort,
    setSort,
    sources,
}: NewsFilterPanelProps) => {
    const { t } = useTranslation('news');

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <BaseSelect
                    options={[
                        { value: 'all', label: t('filter.period.all') },
                        { value: 'today', label: t('filter.period.today') },
                        { value: 'week', label: t('filter.period.week') },
                        { value: 'month', label: t('filter.period.month') },
                    ]}
                    value={period}
                    onChange={event =>
                        setPeriod(
                            event.target.value as
                                | 'all'
                                | 'today'
                                | 'week'
                                | 'month',
                        )
                    }
                    className={filterSelectClass}
                />

                <BaseSelect
                    options={[
                        { value: 'all', label: t('filter.source.all') },
                        ...sources
                            .filter(item => item !== 'all')
                            .map(item => ({ value: item, label: item })),
                    ]}
                    value={source}
                    onChange={event => setSource(event.target.value)}
                    className={filterSelectClass}
                />

                <BaseSelect
                    options={[
                        { value: 'recent', label: t('filter.sort.recent') },
                        {
                            value: 'most-read',
                            label: t('filter.sort.mostRead'),
                        },
                        {
                            value: 'trending',
                            label: t('filter.sort.trending'),
                        },
                    ]}
                    value={sort}
                    onChange={event =>
                        setSort(
                            event.target.value as
                                | 'recent'
                                | 'most-read'
                                | 'trending',
                        )
                    }
                    className={filterSelectClass}
                />
            </div>
        </div>
    );
};

export default NewsFilterPanel;
