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
        onChange([...value, { id: publisher.id, name: publisher.name }]);
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
                            className="inline-flex items-center gap-1.5 rounded-ui-full border border-ui-accent-50 bg-ui-accent-25 py-1 pl-2.5 pr-1.5 text-ui-tiny font-ui-bold text-ui-accent-fg"
                        >
                            {entry.name ?? `#${entry.id}`}
                            <button
                                type="button"
                                aria-label={t('dashboard.titles.form.removePublisher')}
                                onClick={() => remove(entry.id)}
                                className="flex size-4 items-center justify-center rounded-ui-full text-ui-accent-fg transition-colors hover:bg-ui-accent-50 hover:text-ui-on-accent"
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
                excludeKeys={value.map(entry => entry.id)}
                emptyLabel={t('dashboard.titles.form.publishersEmpty')}
            />
        </div>
    );
};

export default PublishersInput;
