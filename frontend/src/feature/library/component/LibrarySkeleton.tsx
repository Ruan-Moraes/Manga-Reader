const LibrarySkeleton = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
            <div
                key={i}
                className="flex gap-3 p-3 border rounded-xs border-tertiary animate-pulse"
            >
                <div className="w-20 h-28 bg-tertiary/30 rounded-xs flex-shrink-0" />
                <div className="flex flex-col flex-1 gap-2">
                    <div className="h-4 w-3/4 bg-tertiary/30 rounded-xs" />
                    <div className="h-3 w-1/3 bg-tertiary/30 rounded-xs" />
                    <div className="h-6 w-24 bg-tertiary/30 rounded-xs" />
                    <div className="h-6 w-16 bg-tertiary/30 rounded-xs" />
                </div>
            </div>
        ))}
    </div>
);

export default LibrarySkeleton;
