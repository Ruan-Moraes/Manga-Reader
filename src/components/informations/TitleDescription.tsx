import GenresBox from '../boxes/GenresBox';

import { TitleTypes } from '../../types/TitleTypes';

type TitleDescriptionTypes = Pick<TitleTypes, 'genres' | 'synopsis'>;

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
                <GenresBox genres={genres} />
            </div>
        </>
    );
};

export default TitleDescription;
