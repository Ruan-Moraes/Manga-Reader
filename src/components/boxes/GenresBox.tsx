type GenresBoxTypes = {
    genres: string[] | string;
};

const GenresBox = ({genres = 'Carregando...'}: GenresBoxTypes) => {
    return (
        <div className="text-xs text-center">
            {Array.isArray(genres) ? (
                <ul className="flex flex-wrap gap-1">
                    {genres.map((genre, index) => (
                        <li
                            key={index}
                            className="p-1 border rounded-xs bg-secondary border-tertiary"
                        >
                            {genre}
                        </li>
                    ))}
                </ul>
            ) : (
                <span className="text-tertiary">{genres}</span>
            )}
        </div>
    );
};

export default GenresBox;
