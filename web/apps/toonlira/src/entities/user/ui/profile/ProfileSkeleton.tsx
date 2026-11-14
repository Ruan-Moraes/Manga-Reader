const ProfileSkeleton = () => {
    return (
        <div className="animate-pulse space-y-4">
            {/* Banner */}
            <div className="h-40 bg-tertiary/20 rounded-t-xs sm:h-52" />

            {/* Header */}
            <div className="px-4 pt-10 space-y-2">
                <div className="h-6 w-40 bg-tertiary/20 rounded-xs" />
                <div className="h-4 w-24 bg-tertiary/20 rounded-xs" />
                <div className="h-4 w-full bg-tertiary/20 rounded-xs" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 px-4 sm:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 bg-tertiary/20 rounded-xs" />
                ))}
            </div>

            {/* Tabs placeholder */}
            <div className="h-10 mx-4 bg-tertiary/20 rounded-xs" />

            {/* Content placeholder */}
            <div className="h-40 mx-4 bg-tertiary/20 rounded-xs" />
        </div>
    );
};

export default ProfileSkeleton;
