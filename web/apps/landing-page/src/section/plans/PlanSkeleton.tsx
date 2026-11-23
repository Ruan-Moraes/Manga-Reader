import Skeleton from '@/shared/component/Skeleton';

export function PlanSkeleton() {
    return (
        <div
            data-testid="plan-skeleton"
            className="flex h-full flex-col rounded-[14px] border border-border bg-card p-6 sm:p-7"
        >
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="my-5 h-9 w-3/5" />
            <div className="flex flex-col gap-3 py-2">
                <Skeleton className="h-3 w-[85%]" />
                <Skeleton className="h-3 w-[77%]" />
                <Skeleton className="h-3 w-[69%]" />
                <Skeleton className="h-3 w-[61%]" />
            </div>
            <Skeleton className="mt-auto h-12 w-full pt-4" />
        </div>
    );
}
