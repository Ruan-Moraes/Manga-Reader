import { useState, useId } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';

export interface AccordionItemProps {
    title: ReactNode;
    children: ReactNode;
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const AccordionItem = ({ title, children, defaultOpen = false, open, onOpenChange }: AccordionItemProps) => {
    const [internal, setInternal] = useState(defaultOpen);

    const isOpen = open ?? internal;

    const id = useId();

    const toggle = () => {
        const next = !isOpen;

        if (open === undefined) {
            setInternal(next);
        }

        onOpenChange?.(next);
    };

    return (
        <article
            className={cn(
                'overflow-hidden rounded-mr-xs border bg-mr-surface transition-colors duration-mr-default',
                isOpen ? 'border-mr-accent-border' : 'border-mr-border',
            )}
        >
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`acc-${id}`}
                onClick={toggle}
                className="flex w-full items-center gap-3 p-4 text-left text-mr-body font-mr-bold text-mr-fg transition-colors hover:bg-mr-accent-25"
            >
                <span className="flex-1">{title}</span>
                <span
                    className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-mr-xs transition-colors',
                        isOpen ? 'bg-mr-accent text-mr-on-accent' : 'bg-mr-accent-25 text-mr-accent-fg',
                    )}
                >
                    {isOpen ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
                </span>
            </button>
            <div id={`acc-${id}`} hidden={!isOpen} className="border-t border-mr-border-subtle p-4 text-mr-body leading-relaxed text-mr-fg-muted">
                {children}
            </div>
        </article>
    );
};

export default AccordionItem;
