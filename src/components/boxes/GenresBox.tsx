type GenresBoxTypes = {
    genres: string[];
};

const GenresBox = ({ genres }: GenresBoxTypes) => {
    return (
        <div className="text-xs text-center">
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
        </div>
    );
};

export default GenresBox;
