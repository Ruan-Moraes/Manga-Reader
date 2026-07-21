import { useTranslation } from 'react-i18next';
import { ChevronDown, Filter } from 'lucide-react';

import { DropdownMenu, type DropdownMenuItem } from '@ui/DropdownMenu';

import { REVIEW_SORT_KEYS, type ReviewSortKey } from '../model/reviewSort';

export interface ReviewSortDropdownProps {
    sort: ReviewSortKey;
    onChange: (sort: ReviewSortKey) => void;
}

/** Dropdown de ordenação de resenhas (top/recentes/etc.). Domínio de review, reusável. */
export const ReviewSortDropdown = ({ sort, onChange }: ReviewSortDropdownProps) => {
    const { t } = useTranslation('rating');

    const items: DropdownMenuItem[] = REVIEW_SORT_KEYS.map(key => ({
        label: t(`reviews.sort.${key}`),
        selected: sort === key,
        onSelect: () => onChange(key),
    }));

    return (
        <DropdownMenu
            trigger={
                <button
                    type="button"
                    className="flex h-9 items-center gap-2 rounded-mr-xs border border-mr-tertiary bg-mr-secondary px-3 text-[13px] font-mr-bold text-mr-fg hover:border-mr-accent-50"
                >
                    <Filter className="size-3.5" aria-hidden="true" />
                    <span>{t(`reviews.sort.${sort}`)}</span>
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
            }
            items={items}
            side="bottom"
            align="end"
            avoidCollisions={false}
            modal={false}
        />
    );
};

export default ReviewSortDropdown;
