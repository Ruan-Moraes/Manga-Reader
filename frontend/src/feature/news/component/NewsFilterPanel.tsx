type NewsFilterPanelProps = {
    period: 'all' | 'today' | 'week' | 'month';
    setPeriod: (value: 'all' | 'today' | 'week' | 'month') => void;
    source: string;
    setSource: (value: string) => void;
    sort: 'recent' | 'most-read' | 'trending';
    setSort: (value: 'recent' | 'most-read' | 'trending') => void;
    sources: readonly string[];
};

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
            <select
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
                className="w-full px-3 py-2 border rounded-lg border-tertiary bg-secondary"
            >
                <option value="all">Todo período</option>
                <option value="today">Hoje</option>
                <option value="week">Última semana</option>
                <option value="month">Último mês</option>
            </select>

            <select
                value={source}
                onChange={event => setSource(event.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-tertiary bg-secondary"
            >
                <option value="all">Todas as fontes</option>
                {sources
                    .filter(item => item !== 'all')
                    .map(item => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
            </select>

            <select
                value={sort}
                onChange={event =>
                    setSort(
                        event.target.value as
                            | 'recent'
                            | 'most-read'
                            | 'trending',
                    )
                }
                className="w-full px-3 py-2 border rounded-lg border-tertiary bg-secondary"
            >
                <option value="recent">Mais recentes</option>
                <option value="most-read">Mais lidas</option>
                <option value="trending">Trending</option>
            </select>
        </div>
    </div>
);

export default NewsFilterPanel;
