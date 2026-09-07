import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const TrendGrowthBadge = ({ value, compact = false }: { value: number; compact?: boolean }) => {
    const positive = value >= 0;
    const Icon = positive ? ArrowUpRight : ArrowDownRight;

    return (
        <span
            className={`inline-flex items-center gap-0.5 font-ui-bold ${compact ? 'text-ui-tiny' : 'rounded-full px-2.5 py-1 text-ui-tiny'} ${positive ? 'text-ui-accent-fg' : 'text-ui-danger'} ${!compact && positive ? 'bg-ui-accent/10' : ''} ${!compact && !positive ? 'bg-ui-danger/10' : ''}`}
        >
            <Icon className="size-3.5" aria-hidden="true" />
            {positive ? '+' : ''}{value.toFixed(0)}%
        </span>
    );
};

export default TrendGrowthBadge;
