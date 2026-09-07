import Icon, { type IconName } from '@/shared/component/Icon';

interface PlatformBadgeProps {
    icon: IconName;
    label: string;
    accent?: boolean;
}

export default function PlatformBadge({
    icon,
    label,
    accent = false,
}: PlatformBadgeProps) {
    return (
        <span
            className={`inline-flex min-h-9 items-center gap-[7px] rounded-full border px-3.5 py-[7px] text-[0.8125rem] font-bold tracking-[0.04em] whitespace-nowrap ${accent ? 'border-accent-muted bg-accent-subtle text-accent-fg' : 'border-line bg-card text-copy'}`}
        >
            <Icon name={icon} size={15} stroke={2.2} />
            {label}
        </span>
    );
}
