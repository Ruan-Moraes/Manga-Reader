import type { ReactNode } from 'react';

/** Labeled field wrapper for the admin event form (label + control stack). */
const EventFormField = ({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold">{required ? `${label} *` : label}</span>
        {children}
    </div>
);

export default EventFormField;
