import { useState } from 'react';

import AppLink from '@shared/component/link/element/AppLink';

import type { ReadingListType, SavedMangaItem } from '../type/saved-library.types';

const listTypes: ReadingListType[] = ['Lendo', 'Quero Ler', 'Concluído'];

type Props = {
    manga: SavedMangaItem;
    onChangeList: (titleId: string, list: ReadingListType) => void;
    onRemove: (titleId: string) => void;
};

const LibraryCard = ({ manga, onChangeList, onRemove }: Props) => {
    const [confirming, setConfirming] = useState(false);

    return (
        <article className="flex gap-3 p-3 border rounded-xs border-tertiary bg-secondary/20 hover:bg-secondary/40 transition-colors">
            <AppLink link={`/title/${manga.titleId}`}>
                <img
                    src={manga.cover}
                    alt={manga.name}
                    className="object-cover w-20 h-28 rounded-xs flex-shrink-0"
                />
            </AppLink>
            <div className="flex flex-col flex-1 gap-2 min-w-0">
                <AppLink
                    link={`/title/${manga.titleId}`}
                    text={manga.name}
                    className="text-sm font-medium truncate"
                />
                <span className="text-xs text-tertiary">{manga.type}</span>
                <select
                    value={manga.list}
                    onChange={e => onChangeList(manga.titleId, e.target.value as ReadingListType)}
                    className="px-2 py-1 text-xs border rounded-xs border-tertiary bg-primary-default w-fit"
                >
                    {listTypes.map(list => (
                        <option key={list} value={list}>
                            {list}
                        </option>
                    ))}
                </select>
                {confirming ? (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-quinary-default">Tem certeza?</span>
                        <button
                            onClick={() => { onRemove(manga.titleId); setConfirming(false); }}
                            className="px-2 py-0.5 border rounded-xs border-quinary-default text-quinary-default hover:bg-quinary-default/20"
                        >
                            Confirmar
                        </button>
                        <button
                            onClick={() => setConfirming(false)}
                            className="px-2 py-0.5 border rounded-xs border-tertiary hover:bg-tertiary/20"
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirming(true)}
                        className="px-2 py-1 text-xs border rounded-xs border-tertiary hover:bg-quinary-default/10 text-quinary-default w-fit"
                    >
                        Remover
                    </button>
                )}
            </div>
        </article>
    );
};

export default LibraryCard;
