import { cn } from '@shared/lib/cn';

export interface ProgressBarProps {
    value: number;
    indeterminate?: boolean;
    thickness?: 'thin' | 'thick';
    animated?: boolean;
    tone?: 'accent' | 'danger';
    label?: string;
    className?: string;
}

export const ProgressBar = ({ value, indeterminate, thickness = 'thin', animated = true, tone = 'accent', label, className }: ProgressBarProps) => {
    const clamped = Math.min(100, Math.max(0, value));

    const height = thickness === 'thick' ? 'h-3' : 'h-1';

    const fillColor = tone === 'danger' ? 'bg-ui-danger' : 'bg-ui-accent';

    return (
        <div
            role="progressbar"
            aria-valuenow={indeterminate ? undefined : clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
            className={cn('relative w-full overflow-hidden rounded-ui-full bg-ui-gray-700', height, className)}
        >
            <div
                className={cn(
                    'absolute inset-y-0 left-0 rounded-ui-full',
                    fillColor,
                    animated && !indeterminate && 'transition-[width] duration-ui-default ease-mr',
                    indeterminate && 'w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite]',
                )}
                style={indeterminate ? undefined : { width: `${clamped}%` }}
            />
        </div>
    );
};

export default ProgressBar;
