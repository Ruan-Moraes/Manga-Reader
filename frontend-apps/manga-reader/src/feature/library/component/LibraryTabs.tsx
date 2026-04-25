import { useTranslation } from 'react-i18next';

import type {
    LibraryCounts,
    ReadingListType,
} from '../type/saved-library.types';

type ActiveTab = ReadingListType | 'Todos';

type Props = {
    activeTab: ActiveTab;
    counts: LibraryCounts;
    onChange: (tab: ActiveTab) => void;
};

const tabs: {
    id: ActiveTab;
    i18nKey: string;
    countKey: keyof LibraryCounts;
}[] = [
    { id: 'Todos', i18nKey: 'all', countKey: 'total' },
    { id: 'Lendo', i18nKey: 'reading', countKey: 'lendo' },
    { id: 'Quero Ler', i18nKey: 'wantToRead', countKey: 'queroLer' },
    { id: 'Concluído', i18nKey: 'completed', countKey: 'concluido' },
];

const LibraryTabs = ({ activeTab, counts, onChange }: Props) => {
    const { t } = useTranslation('library');

    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map(({ id, i18nKey, countKey }) => (
                <button
                    key={id}
                    onClick={() => onChange(id)}
                    className={`px-3 py-1.5 text-sm border rounded-xs transition-colors flex items-center gap-1.5 ${
                        activeTab === id
                            ? 'bg-quaternary text-shadow-default border-quaternary font-semibold'
                            : 'bg-secondary border-tertiary hover:bg-tertiary/30'
                    }`}
                >
                    {t(`tabs.${i18nKey}`)}
                    <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                            activeTab === id
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
};

export default LibraryTabs;
