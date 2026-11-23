import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export interface FormRowProps {
    /** Colunas a partir de `sm`; no mobile sempre colapsa para 1 coluna. */
    columns?: 1 | 2 | 3;
    children: ReactNode;
    className?: string;
}

const columnsMap: Record<NonNullable<FormRowProps['columns']>, string> = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
};

/** Linha de formulário em grid — campos relacionados lado a lado em telas ≥ sm. */
export const FormRow = ({ columns = 2, children, className }: FormRowProps) => (
    <div className={cn('grid grid-cols-1 gap-3 sm:gap-4', columnsMap[columns], className)}>{children}</div>
);

export default FormRow;
