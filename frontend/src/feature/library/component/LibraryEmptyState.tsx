import type { ReadingListType } from '../type/saved-library.types';

type ActiveTab = ReadingListType | 'Todos';

const messages: Record<ActiveTab, string> = {
    Todos: 'Sua biblioteca está vazia. Explore títulos e salve seus favoritos!',
    Lendo: 'Nenhum título em andamento. Comece a ler algo novo!',
    'Quero Ler': 'Nenhum título na lista de desejos. Descubra novas obras!',
    Concluído: 'Nenhum título concluído ainda. Continue lendo!',
};

const LibraryEmptyState = ({ tab }: { tab: ActiveTab }) => (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <span className="text-4xl">&#128218;</span>
        <p className="text-sm text-tertiary max-w-xs">{messages[tab]}</p>
    </div>
);

export default LibraryEmptyState;
