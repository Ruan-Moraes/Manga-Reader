import type { ReactNode } from 'react';

type FieldProps = {
    label: ReactNode;
    hint?: ReactNode;
    children: ReactNode;
};

/** Rótulo + (opcional) hint + controle. Wrapper padrão dos campos de formulário admin. */
const Field = ({ label, hint, children }: FieldProps) => (
    <label className="flex flex-col gap-1.5">
        <span className="text-ui-small font-ui-bold text-ui-fg-muted">{label}</span>
        {children}
        {hint && <span className="text-ui-tiny text-ui-fg-subtle">{hint}</span>}
    </label>
);

export default Field;
