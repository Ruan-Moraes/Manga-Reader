import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@ui/Checkbox';
import { RadioGroup } from '@ui/Radio';
import { Button } from '@ui/Button';
import { SearchField } from '@ui/SearchField';

import type { PublicationStatus, Tag } from '@entities/catalog-filter';

const MAX_VISIBLE_TAGS = 20;

type CategoryFilterPanelProps = {
    tags: Tag[];
    selectedTags: Tag[];
    onTagToggle: (tag: Tag) => void;
    selectedStatus: PublicationStatus;
    onStatusChange: (v: PublicationStatus) => void;
    onClearAll: () => void;
    activeCount: number;
};

const CategoryFilterPanel = ({ tags, selectedTags, onTagToggle, selectedStatus, onStatusChange, onClearAll, activeCount }: CategoryFilterPanelProps) => {
    const { t } = useTranslation('manga');

    const [tagQuery, setTagQuery] = useState('');

    const normalizedQuery = tagQuery.trim().toLowerCase();
    const visibleTags = tags.filter(tag => tag.label.toLowerCase().includes(normalizedQuery)).slice(0, MAX_VISIBLE_TAGS);

    const statusOptions: { value: PublicationStatus; label: string }[] = [
        { value: 'all', label: t('filters.statusOptions.all') },
        { value: 'ongoing', label: t('filters.statusOptions.ongoing') },
        { value: 'complete', label: t('filters.statusOptions.complete') },
        { value: 'hiatus', label: t('filters.statusOptions.hiatus') },
        { value: 'cancelled', label: t('filters.statusOptions.cancelled') },
    ];

    return (
        <div className="rounded-mr-md border border-mr-border bg-mr-surface p-4 shadow-mr-elevated xl:p-5">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-mr-border pb-4">
                <div>
                    <p className="mr-label text-mr-fg-subtle">{t('filters.refine')}</p>
                    <h3 className="mt-1 text-mr-h4 font-mr-extrabold text-mr-fg">{t('filters.filtersButton')}</h3>
                </div>
                {activeCount > 0 && <span className="rounded-mr-full bg-mr-accent px-2.5 py-1 text-mr-tiny font-mr-bold text-mr-on-accent">{activeCount}</span>}
            </div>

            <div className="flex flex-col gap-5">
            <fieldset className="m-0 border-none p-0">
                <legend className="mb-2 text-mr-tiny font-mr-bold text-mr-fg">{t('filters.genres')}</legend>
                <SearchField
                    value={tagQuery}
                    onChange={setTagQuery}
                    size="sm"
                    placeholder={t('filters.tagSearchPlaceholder')}
                    aria-label={t('filters.tagSearchPlaceholder')}
                    className="mb-3"
                />
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                    {visibleTags.length === 0 ? (
                        <p className="py-2 text-mr-tiny text-mr-fg-subtle">{t('filters.noTagsFound')}</p>
                    ) : (
                        visibleTags.map(tag => (
                            <Checkbox
                                key={tag.value}
                                label={tag.label}
                                checked={selectedTags.some(t => t.value === tag.value)}
                                onChange={() => onTagToggle(tag)}
                            />
                        ))
                    )}
                </div>
            </fieldset>

            <div className="h-px bg-mr-border" />

            <RadioGroup
                name="status-filter"
                legend={t('filters.status')}
                value={selectedStatus}
                onChange={v => onStatusChange(v as PublicationStatus)}
                options={statusOptions}
            />

            {activeCount > 0 && (
                <Button variant="ghost" onClick={onClearAll} className="mt-1 w-full">
                    {t('filters.clearAll')}
                </Button>
            )}
            </div>
        </div>
    );
};

export default CategoryFilterPanel;
