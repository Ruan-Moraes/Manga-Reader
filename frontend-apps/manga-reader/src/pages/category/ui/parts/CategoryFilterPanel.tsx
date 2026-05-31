import { useTranslation } from 'react-i18next';
import { Checkbox } from '@ui/Checkbox';
import { RadioGroup } from '@ui/Radio';
import { Button } from '@ui/Button';

import type { PublicationStatus, Tag } from '@entities/catalog-filter';

type CategoryFilterPanelProps = {
    tags: Tag[];
    selectedTags: Tag[];
    onTagToggle: (tag: Tag) => void;
    selectedStatus: PublicationStatus;
    onStatusChange: (v: PublicationStatus) => void;
    onClearAll: () => void;
};

const CategoryFilterPanel = ({ tags, selectedTags, onTagToggle, selectedStatus, onStatusChange, onClearAll }: CategoryFilterPanelProps) => {
    const { t } = useTranslation('manga');

    const statusOptions: { value: PublicationStatus; label: string }[] = [
        { value: 'all', label: t('filters.statusOptions.all') },
        { value: 'ongoing', label: t('filters.statusOptions.ongoing') },
        { value: 'complete', label: t('filters.statusOptions.complete') },
        { value: 'hiatus', label: t('filters.statusOptions.hiatus') },
        { value: 'cancelled', label: t('filters.statusOptions.cancelled') },
    ];

    return (
        <div className="flex flex-col gap-5">
            <fieldset className="m-0 border-none p-0">
                <legend className="mb-2 text-mr-tiny font-mr-bold text-mr-fg">{t('filters.genres')}</legend>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                    {tags.slice(0, 20).map(tag => (
                        <Checkbox key={tag.value} label={tag.label} checked={selectedTags.some(t => t.value === tag.value)} onChange={() => onTagToggle(tag)} />
                    ))}
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

            <Button variant="ghost" onClick={onClearAll} className="mt-2">
                {t('filters.clearAll')}
            </Button>
        </div>
    );
};

export default CategoryFilterPanel;
