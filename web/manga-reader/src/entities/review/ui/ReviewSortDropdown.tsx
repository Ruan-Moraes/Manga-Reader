import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Filter } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { REVIEW_SORT_KEYS, type ReviewSortKey } from '../model/reviewSort';

export interface ReviewSortDropdownProps {
    sort: ReviewSortKey;
    onChange: (sort: ReviewSortKey) => void;
}

/** Dropdown de ordenação de resenhas (top/recentes/etc.). Domínio de review, reusável. */
export const ReviewSortDropdown = ({ sort, onChange }: ReviewSortDropdownProps) => {
    const { t } = useTranslation('rating');

    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="flex h-9 items-center gap-2 rounded-mr-xs border border-mr-tertiary bg-mr-secondary px-3 text-[13px] font-mr-bold text-mr-fg hover:border-mr-accent-50"
            >
                <Filter className="size-3.5" aria-hidden="true" />
                <span>{t(`reviews.sort.${sort}`)}</span>
                <ChevronDown className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <ul
                        role="listbox"
                        className="absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-mr-xs border border-[#444] bg-[#1a1a1b] py-1 shadow-[0_12px_32px_rgba(0,0,0,.55)]"
                    >
                        {REVIEW_SORT_KEYS.map(key => (
                            <li
                                key={key}
                                role="option"
                                aria-selected={sort === key}
                                onClick={() => {
                                    onChange(key);
                                    setOpen(false);
                                }}
                                className={cn(
                                    'flex cursor-pointer items-center justify-between px-3 py-2 text-[13px] transition-colors',
                                    sort === key ? 'bg-mr-accent-25 font-mr-bold text-mr-accent' : 'text-mr-fg hover:bg-mr-secondary',
                                )}
                            >
                                {t(`reviews.sort.${key}`)}
                                {sort === key && <Check className="size-3.5 text-mr-accent" aria-hidden="true" />}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
};

export default ReviewSortDropdown;
