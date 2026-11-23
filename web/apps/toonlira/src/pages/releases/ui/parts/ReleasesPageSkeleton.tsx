import { Skeleton } from '@ui/Skeleton';

export const ReleasesPageSkeleton = () => (
    <div aria-label="loading" className="space-y-8">
        {[0, 1].map(group => (
            <section key={group}>
                <Skeleton width="min(260px, 70%)" height={24} className="mb-3" />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map(item => (
                        <div key={item} className="flex gap-3 rounded-ui-xs border border-ui-border bg-ui-surface p-3">
                            <Skeleton width={56} height={84} />
                            <div className="flex-1 space-y-3 pt-1">
                                <Skeleton variant="text" height={14} />
                                <Skeleton variant="text" width="55%" height={12} />
                                <Skeleton variant="text" width="75%" height={12} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        ))}
    </div>
);
