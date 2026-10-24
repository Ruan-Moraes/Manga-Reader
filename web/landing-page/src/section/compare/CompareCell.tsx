import Icon from '@/shared/component/Icon';
import type { CompareValue } from '@/shared/data/compare';

interface CompareCellProps {
    value: CompareValue;
    limited: string;
    yes: string;
    no: string;
}

export function CompareCell({ value, limited, yes, no }: CompareCellProps) {
    return (
        <span className="inline-flex min-h-5 w-full items-center justify-center text-center">
            {value === 'yes' ? (
                <>
                    <Icon name="check" size={20} stroke={3} />
                    <span className="sr-only">{yes}</span>
                </>
            ) : value === 'no' ? (
                <>
                    <Icon name="x" size={18} />
                    <span className="sr-only">{no}</span>
                </>
            ) : (
                <span className="text-xs font-extrabold text-quinary">
                    {limited}
                </span>
            )}
        </span>
    );
}

export default CompareCell;
