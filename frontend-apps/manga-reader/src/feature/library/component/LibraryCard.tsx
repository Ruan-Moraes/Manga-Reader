import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseSelect from '@shared/component/input/BaseSelect';
import AppLink from '@shared/component/link/element/AppLink';

import type {
    ReadingListType,
    SavedMangaItem,
} from '../type/saved-library.types';

const listTypes: { id: ReadingListType; i18nKey: string }[] = [
    { id: 'Lendo', i18nKey: 'reading' },
    { id: 'Quero Ler', i18nKey: 'wantToRead' },
    { id: 'Concluído', i18nKey: 'completed' },
];

type Props = {
    manga: SavedMangaItem;
    onChangeList: (titleId: string, list: ReadingListType) => void;
    onRemove: (titleId: string) => void;
};

const LibraryCard = ({ manga, onChangeList, onRemove }: Props) => {
    const { t } = useTranslation('library');
    const [confirming, setConfirming] = useState(false);

    return (
        <article className="flex gap-3 p-3 border rounded-xs border-tertiary bg-secondary/20 hover:bg-secondary/40 transition-colors">
            <AppLink link={`title/${manga.titleId}`}>
                <img
                    src={manga.cover}
                    alt={manga.name}
                    className="object-cover w-20 h-28 rounded-xs flex-shrink-0"
                />
            </AppLink>
            <div className="flex flex-col flex-1 gap-2 min-w-0">
                <AppLink
                    link={`title/${manga.titleId}`}
                    text={manga.name}
                    className="text-sm font-medium truncate"
                />
                <span className="text-xs text-tertiary">{manga.type}</span>
                <BaseSelect
                    options={listTypes.map(list => ({
                        value: list.id,
                        label: t(`tabs.${list.i18nKey}`),
                    }))}
                    value={manga.list}
                    onChange={e =>
                        onChangeList(
                            manga.titleId,
                            e.target.value as ReadingListType,
                        )
                    }
                    className="px-2 py-1 text-xs border rounded-xs border-tertiary bg-primary-default w-fit"
                />
                {confirming ? (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-quinary-default">
                            {t('card.confirmPrompt')}
                        </span>
                        <button
                            onClick={() => {
                                onRemove(manga.titleId);
                                setConfirming(false);
                            }}
                            className="px-2 py-0.5 border rounded-xs border-quinary-default text-quinary-default hover:bg-quinary-default/20"
                        >
                            {t('card.confirm')}
                        </button>
                        <button
                            onClick={() => setConfirming(false)}
                            className="px-2 py-0.5 border rounded-xs border-tertiary hover:bg-tertiary/20"
                        >
                            {t('card.cancel')}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirming(true)}
                        className="px-2 py-1 text-xs border rounded-xs border-tertiary hover:bg-quinary-default/10 text-quinary-default w-fit"
                    >
                        {t('card.remove')}
                    </button>
                )}
            </div>
        </article>
    );
};

export default LibraryCard;
