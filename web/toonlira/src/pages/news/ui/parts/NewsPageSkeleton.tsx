import { Skeleton } from '@ui/Skeleton';

export const NewsPageSkeleton = () => (
    <div className="space-y-6" aria-label="Carregando notícias">
        <Skeleton className="h-[360px] sm:h-[440px]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-[360px]" />)}
        </div>
    </div>
);
