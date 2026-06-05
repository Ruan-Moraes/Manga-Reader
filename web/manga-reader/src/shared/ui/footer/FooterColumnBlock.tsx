import { ChevronDown } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import type { FooterColumn } from './footer.types';
import { COLUMN_DESKTOP_TITLE_CLASSES, LINK_CLASSES } from './footer.types';

export const FooterColumnBlock = ({
    column,
    isOpen,
    onToggle,
    expandLabel,
    collapseLabel,
}: {
    column: FooterColumn;
    isOpen: boolean;
    onToggle: () => void;
    expandLabel: string;
    collapseLabel: string;
}) => (
    <div className="border-b border-mr-gray-800 md:border-none">
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-label={isOpen ? `${collapseLabel}: ${column.title}` : `${expandLabel}: ${column.title}`}
            className="flex w-full min-h-[48px] items-center justify-between gap-3 py-3 md:hidden"
        >
            <span className="text-xs font-mr-extrabold uppercase tracking-[0.1rem] pb-[0.125rem] md:border-b border-mr-tertiary">{column.title}</span>
            <ChevronDown
                aria-hidden="true"
                className="size-4 text-mr-fg-subtle transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
        </button>
        <div aria-hidden="true" className="hidden md:block">
            <span className={COLUMN_DESKTOP_TITLE_CLASSES}>{column.title}</span>
        </div>
        <ul className={cn('flex flex-col gap-[2px] pb-3 md:pb-0 md:flex', !isOpen && 'hidden md:flex')}>
            {column.links.map(l => (
                <li key={`${column.title}-${l.label}`}>
                    <a
                        href={l.href}
                        onClick={l.onClick}
                        rel={l.external ? 'noopener noreferrer' : undefined}
                        target={l.external ? '_blank' : undefined}
                        className={LINK_CLASSES}
                    >
                        {l.label}
                    </a>
                </li>
            ))}
        </ul>
    </div>
);
