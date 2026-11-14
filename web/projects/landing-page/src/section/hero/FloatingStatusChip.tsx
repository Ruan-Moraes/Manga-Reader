import Icon, { type IconName } from '@/shared/component/Icon';

export default function FloatingStatusChip({
    icon,
    label,
    accent = false,
    className = '',
}: {
    icon: IconName;
    label: string;
    accent?: boolean;
    className?: string;
}) {
    return (
        <span
            className={`absolute z-[3] items-center gap-2 rounded-full border border-border-strong bg-floating px-[13px] py-[9px] text-[0.75rem] font-extrabold whitespace-nowrap text-fg shadow-[var(--shadow-floating)] backdrop-blur-lg ${accent ? 'border-accent-muted text-accent-fg' : ''} ${className}`}
        >
            <Icon name={icon} size={15} stroke={2.2} />
            {label}
        </span>
    );
}
