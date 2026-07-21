import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

import { getAdminPublishers } from '../../api/adminPublisherService';
import type { AdminPublisher, TitlePublisherRef } from '../../model/admin.types';
import EntitySearchSelect from './EntitySearchSelect';

type PublishersInputProps = {
    value: TitlePublisherRef[];
    onChange: (next: TitlePublisherRef[]) => void;
};

const PublishersInput = ({ value, onChange }: PublishersInputProps) => {
    const { t } = useTranslation('admin');

    const add = (publisher: AdminPublisher) => {
        onChange([...value, { id: Number(publisher.id), name: publisher.name }]);
    };

    const remove = (id: number) => {
        onChange(value.filter(entry => entry.id !== id));
    };

    return (
        <div className="flex flex-col gap-2">
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map(entry => (
                        <span
                            key={entry.id}
                            className="inline-flex items-center gap-1.5 rounded-mr-full border border-mr-accent-50 bg-mr-accent-25 py-1 pl-2.5 pr-1.5 text-mr-tiny font-mr-bold text-mr-accent-fg"
                        >
                            {entry.name ?? `#${entry.id}`}
                            <button
                                type="button"
                                aria-label={t('dashboard.titles.form.removePublisher')}
                                onClick={() => remove(entry.id)}
                                className="flex size-4 items-center justify-center rounded-mr-full text-mr-accent-fg transition-colors hover:bg-mr-accent-50 hover:text-mr-on-accent"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <EntitySearchSelect<AdminPublisher>
                queryKey="adminPublisherSearch"
                fetcher={async term => (await getAdminPublishers(0, 10, term || undefined)).content}
                getKey={publisher => publisher.id}
                getLabel={publisher => publisher.name}
                onPick={add}
                placeholder={t('dashboard.titles.form.publishersSearch')}
                excludeKeys={value.map(entry => String(entry.id))}
                emptyLabel={t('dashboard.titles.form.publishersEmpty')}
            />
        </div>
    );
};

export default PublishersInput;
