import type { ReactNode } from 'react';

type FieldProps = {
    label: ReactNode;
    hint?: ReactNode;
    children: ReactNode;
};

/** Rótulo + (opcional) hint + controle. Wrapper padrão dos campos de formulário admin. */
const Field = ({ label, hint, children }: FieldProps) => (
    <label className="flex flex-col gap-1.5">
        <span className="text-mr-small font-mr-bold text-mr-fg-muted">{label}</span>
        {children}
        {hint && <span className="text-mr-tiny text-mr-fg-subtle">{hint}</span>}
    </label>
);

export default Field;
