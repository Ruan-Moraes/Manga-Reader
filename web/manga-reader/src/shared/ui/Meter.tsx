import { cn } from '@shared/lib/cn';

export interface MeterProps {
    /** Preenchimento em porcentagem (0–100). */
    value: number;
    /** Altura da barra em px. */
    height?: number;
    /** Classes do trilho (layout/cor de fundo). */
    className?: string;
    /** Override da cor do trilho (default: `bg-mr-gray-800`). */
    trackClassName?: string;
}

/** Barra de progresso canônica — usada em critérios de resenha e distribuição de notas. */
export const Meter = ({ value, height = 6, className, trackClassName = 'bg-mr-gray-800' }: MeterProps) => (
    <span className={cn('block overflow-hidden rounded-mr-full', trackClassName, className)} style={{ height }} aria-hidden="true">
        <span className="block h-full rounded-mr-full bg-mr-accent transition-[width] duration-500" style={{ width: `${value}%` }} />
    </span>
);

export default Meter;
