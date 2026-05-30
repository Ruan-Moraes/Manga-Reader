import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Title } from '../../type/title.types';
import SynopsisModal from './SynopsisModal';

type TitleDescriptionTypes = Pick<Title, 'name' | 'genres' | 'synopsis'>;

const SYNOPSIS_MAX_LINES = 18;

const TitleDescription = ({ name, genres, synopsis }: TitleDescriptionTypes) => {
    const { t } = useTranslation('manga');
    const synopsisRef = useRef<HTMLParagraphElement>(null);

    const [isClamped, setIsClamped] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const element = synopsisRef.current;

        if (element) {
            setIsClamped(element.scrollHeight > element.clientHeight);
        }
    }, [synopsis]);

    return (
        <>
            <div className="flex flex-col gap-2">
                <div>
                    <h3 className="px-2 py-1 text-sm font-bold text-center rounded-xs bg-tertiary text-shadow-default">{t('synopsis')}</h3>
                </div>
                <div>
                    <p
                        ref={synopsisRef}
                        className="text-xs text-justify overflow-hidden"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: SYNOPSIS_MAX_LINES,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {synopsis}
                    </p>
                    {isClamped && (
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="mt-1 text-xs font-semibold text-quaternary-default hover:text-quaternary-light transition-colors cursor-pointer"
                        >
                            {t('readMore')}
                        </button>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div>
                    <h3 className="px-2 py-1 text-sm font-bold text-center rounded-xs bg-tertiary text-shadow-default">{t('genres')}</h3>
                </div>
                <div className="text-xs text-center">
                    <ul className="flex flex-wrap gap-1">
                        {genres.map(genre => (
                            <li key={genre} className="p-1 border rounded-xs bg-secondary border-tertiary">
                                {genre}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <SynopsisModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={name} synopsis={synopsis} />
        </>
    );
};

export default TitleDescription;
