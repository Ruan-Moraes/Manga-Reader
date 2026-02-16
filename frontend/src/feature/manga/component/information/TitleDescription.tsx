import GenreTagList from '@shared/component/box/GenreTagList';

import { Title } from '../../type/title.types';

type TitleDescriptionTypes = Pick<Title, 'genres' | 'synopsis'>;

const TitleDescription = ({ genres, synopsis }: TitleDescriptionTypes) => {
    return (
        <>
            <div className="flex flex-col gap-2">
                <div>
                    <h3 className="px-2 py-1 text-sm font-bold text-center rounded-xs bg-tertiary text-shadow-default">
                        Sinopse
                    </h3>
                </div>
                <div>
                    <p className="text-xs text-justify">{synopsis}</p>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <div>
                    <h3 className="px-2 py-1 text-sm font-bold text-center rounded-xs bg-tertiary text-shadow-default">
                        Gêneros
                    </h3>
                </div>
                <GenreTagList genres={genres} />
            </div>
        </>
    );
};

export default TitleDescription;
