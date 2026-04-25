import { useTranslation } from 'react-i18next';

import type { ReadingListType } from '../type/saved-library.types';

type ActiveTab = ReadingListType | 'Todos';

const tabToKey: Record<ActiveTab, string> = {
    Todos: 'all',
    Lendo: 'reading',
    'Quero Ler': 'wantToRead',
    Concluído: 'completed',
};

const LibraryEmptyState = ({ tab }: { tab: ActiveTab }) => {
    const { t } = useTranslation('library');

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="text-4xl">&#128218;</span>
            <p className="text-sm text-tertiary max-w-xs">
                {t(`empty.${tabToKey[tab]}`)}
            </p>
        </div>
    );
};

export default LibraryEmptyState;
