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
}: NewsFilterPanelProps) => (
    <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <BaseSelect
                options={[
                    { value: 'all', label: 'Todo período' },
                    { value: 'today', label: 'Hoje' },
                    { value: 'week', label: 'Última semana' },
                    { value: 'month', label: 'Último mês' },
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
                    { value: 'all', label: 'Todas as fontes' },
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
                    { value: 'recent', label: 'Mais recentes' },
                    { value: 'most-read', label: 'Mais lidas' },
                    { value: 'trending', label: 'Trending' },
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

export default NewsFilterPanel;
