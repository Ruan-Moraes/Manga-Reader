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
                'overflow-hidden rounded-ui-xs border bg-ui-surface transition-colors duration-ui-default',
                isOpen ? 'border-ui-accent-border' : 'border-ui-border',
            )}
        >
            <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`acc-${id}`}
                onClick={toggle}
                className="flex w-full items-center gap-3 p-4 text-left text-ui-body font-ui-bold text-ui-fg transition-colors hover:bg-ui-accent-25"
            >
                <span className="flex-1">{title}</span>
                <span
                    className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-ui-xs transition-colors',
                        isOpen ? 'bg-ui-accent text-ui-on-accent' : 'bg-ui-accent-25 text-ui-accent-fg',
                    )}
                >
                    {isOpen ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
                </span>
            </button>
            <div id={`acc-${id}`} hidden={!isOpen} className="border-t border-ui-border-subtle p-4 text-ui-body leading-relaxed text-ui-fg-muted">
                {children}
            </div>
        </article>
    );
};

export default AccordionItem;
