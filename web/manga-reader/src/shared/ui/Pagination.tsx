import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from './Button';

import { paginationRange } from '@shared/lib/pagination';

export interface PaginationProps {
    page: number;
    total: number;
    onChange: (page: number) => void;
    siblings?: number;
}

export const Pagination = ({ page, total, onChange, siblings = 1 }: PaginationProps) => {
    const items = paginationRange(page, total, siblings);

    return (
        <nav role="navigation" aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-1">
            <Button variant="ghost" size="sm" icon={ChevronLeft} disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">
                Anterior
            </Button>
            {items.map((it, i) =>
                it === 'gap' ? (
                    <span key={`gap-${i}`} className="px-2 text-mr-fg-subtle" aria-hidden>
                        …
                    </span>
                ) : (
                    <Button
                        key={it}
                        variant={it === page ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => onChange(it)}
                        aria-current={it === page ? 'page' : undefined}
                        aria-label={`Página ${it}`}
                    >
                        {it}
                    </Button>
                ),
            )}
            <Button variant="ghost" size="sm" iconRight={ChevronRight} disabled={page === total} onClick={() => onChange(page + 1)} aria-label="Próxima página">
                Próxima
            </Button>
        </nav>
    );
};

export default Pagination;
