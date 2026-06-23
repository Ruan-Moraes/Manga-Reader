import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import DataTable, { type Column } from '@ui/DataTable';
import { Badge } from '@ui/Badge';
import { StatusPill } from '@ui/StatusPill';
import useSortableData from '@shared/hook/useSortableData';
import type { LanguageTag } from '@shared/type/i18n';
import { getLocale } from '@shared/lib/formatters';

import type { AdminEvent } from '../model/admin.types';
import { EVENT_STATUS_TONE, statusLabelKey, toneFor } from '../model/statusTone';
import RowActions from './parts/RowActions';

type AdminEventListProps = {
    events: AdminEvent[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (event: AdminEvent) => void;
    onDelete: (event: AdminEvent) => void;
    onRowClick?: (event: AdminEvent) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const buildColumns = (t: TFunction, lang: LanguageTag, onEdit: (event: AdminEvent) => void, onDelete: (event: AdminEvent) => void): Column<AdminEvent>[] => [
    {
        key: 'id',
        header: t('dashboard.events.columnId'),
        hideBelow: 'md',
        render: event => <span className="font-mr-mono text-mr-tiny text-mr-fg-subtle">{event.id.slice(0, 8)}</span>,
    },
    {
        key: 'title',
        header: t('dashboard.events.columnTitle'),
        sortable: true,
        render: event => <span className="font-mr-bold text-mr-fg">{event.title?.[lang] ?? event.title?.['pt-BR'] ?? ''}</span>,
    },
    {
        key: 'type',
        header: t('dashboard.events.columnType'),
        sortable: true,
        hideBelow: 'sm',
        render: event => <Badge variant="neutral">{event.type}</Badge>,
    },
    {
        key: 'status',
        header: t('dashboard.events.columnStatus'),
        sortable: true,
        render: event => <StatusPill tone={toneFor(EVENT_STATUS_TONE, event.status)}>{t(statusLabelKey('event', event.status), { defaultValue: event.status })}</StatusPill>,
    },
    {
        key: 'location',
        header: t('dashboard.events.columnLocation'),
        hideBelow: 'md',
        render: event => <span className="text-mr-fg-subtle">{event.locationIsOnline ? t('dashboard.events.locationOnline') : (event.locationCity ?? '—')}</span>,
    },
    {
        key: 'startDate',
        header: t('dashboard.events.columnStart'),
        sortable: true,
        hideBelow: 'sm',
        render: event => <span className="text-mr-fg-subtle">{formatDate(event.startDate)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.events.columnActions'),
        align: 'right',
        render: event => (
            <RowActions
                onEdit={() => onEdit(event)}
                onDelete={() => onDelete(event)}
                editLabel={t('dashboard.events.editAriaLabel')}
                deleteLabel={t('dashboard.events.deleteAriaLabel')}
            />
        ),
    },
];

const AdminEventList = ({ events, page, totalPages, isLoading, onPageChange, onEdit, onDelete, onRowClick }: AdminEventListProps) => {
    const { t, i18n } = useTranslation('admin');
    const lang = i18n.language as LanguageTag;
    const { sortedData, sortBy, sortDirection, handleSort } = useSortableData(events);

    return (
        <DataTable
            columns={buildColumns(t, lang, onEdit, onDelete)}
            data={sortedData}
            keyExtractor={event => event.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage={t('dashboard.events.empty')}
            onRowClick={onRowClick}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminEventList;
