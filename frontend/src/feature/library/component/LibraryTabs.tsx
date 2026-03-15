import type { LibraryCounts, ReadingListType } from '../type/saved-library.types';

type ActiveTab = ReadingListType | 'Todos';

type Props = {
    activeTab: ActiveTab;
    counts: LibraryCounts;
    onChange: (tab: ActiveTab) => void;
};

const tabs: { label: ActiveTab; countKey: keyof LibraryCounts }[] = [
    { label: 'Todos', countKey: 'total' },
    { label: 'Lendo', countKey: 'lendo' },
    { label: 'Quero Ler', countKey: 'queroLer' },
    { label: 'Concluído', countKey: 'concluido' },
];

const LibraryTabs = ({ activeTab, counts, onChange }: Props) => (
    <div className="flex flex-wrap gap-2">
        {tabs.map(({ label, countKey }) => (
            <button
                key={label}
                onClick={() => onChange(label)}
                className={`px-3 py-1.5 text-sm border rounded-xs transition-colors flex items-center gap-1.5 ${
                    activeTab === label
                        ? 'bg-quaternary text-shadow-default border-quaternary font-semibold'
                        : 'bg-secondary border-tertiary hover:bg-tertiary/30'
                }`}
            >
                {label}
                <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                        activeTab === label
                            ? 'bg-shadow-default/20 text-shadow-default'
                            : 'bg-tertiary/30 text-tertiary'
                    }`}
                >
                    {counts[countKey]}
                </span>
            </button>
        ))}
    </div>
);

export default LibraryTabs;
