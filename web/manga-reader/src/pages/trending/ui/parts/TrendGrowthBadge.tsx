import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const TrendGrowthBadge = ({ value, compact = false }: { value: number; compact?: boolean }) => {
    const positive = value >= 0;
    const Icon = positive ? ArrowUpRight : ArrowDownRight;

    return (
        <span
            className={`inline-flex items-center gap-0.5 font-mr-bold ${compact ? 'text-mr-tiny' : 'rounded-full px-2.5 py-1 text-mr-tiny'} ${positive ? 'text-mr-accent-fg' : 'text-mr-danger'} ${!compact && positive ? 'bg-mr-accent/10' : ''} ${!compact && !positive ? 'bg-mr-danger/10' : ''}`}
        >
            <Icon className="size-3.5" aria-hidden="true" />
            {positive ? '+' : ''}{value.toFixed(0)}%
        </span>
    );
};

export default TrendGrowthBadge;
