import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export interface ModalSectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

/** Grupo de campos com heading dentro do corpo de um Modal — seções após a primeira ganham respiro extra. */
export const ModalSection = ({ title, description, children, className }: ModalSectionProps) => (
    <section className={cn('flex flex-col gap-4 [&:not(:first-child)]:mt-7', className)}>
        {(title ?? description) && (
            <div className="flex flex-col gap-0.5">
                {title && (
                    <h3 className="mr-label flex items-center gap-3 text-mr-accent after:h-px after:flex-1 after:bg-mr-border-subtle">{title}</h3>
                )}
                {description && <p className="text-mr-tiny text-mr-fg-subtle">{description}</p>}
            </div>
        )}
        {children}
    </section>
);

export default ModalSection;
