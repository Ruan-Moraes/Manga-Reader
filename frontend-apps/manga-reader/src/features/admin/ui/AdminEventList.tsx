import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import DataTable, { type Column } from '@shared/component/table/DataTable';
import useSortableData from '@shared/hook/useSortableData';
import type { LanguageTag } from '@shared/type/i18n';

import type { AdminEvent } from '../model/admin.types';
import { getLocale } from '@shared/lib/formatters';
import { Pencil, Trash2 } from 'lucide-react';

type AdminEventListProps = {
    events: AdminEvent[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onEdit: (event: AdminEvent) => void;
    onDelete: (event: AdminEvent) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(getLocale(), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const StatusBadge = ({ status }: { status: string }) => <span className="px-2 py-0.5 text-xs font-semibold rounded-xs bg-tertiary/30">{status}</span>;

const buildColumns = (t: TFunction, lang: LanguageTag, onEdit: (event: AdminEvent) => void, onDelete: (event: AdminEvent) => void): Column<AdminEvent>[] => [
    {
        key: 'id',
        header: t('dashboard.events.columnId'),
        hiddenOnMobile: true,
        render: event => <span className="font-mono text-xs text-tertiary">{event.id.slice(0, 8)}</span>,
    },
    {
        key: 'title',
        header: t('dashboard.events.columnTitle'),
        sortable: true,
        render: event => <span className="font-medium">{event.title?.[lang] ?? event.title?.['pt-BR'] ?? ''}</span>,
    },
    {
        key: 'type',
        header: t('dashboard.events.columnType'),
        sortable: true,
        render: event => <span className="text-xs text-tertiary">{event.type}</span>,
    },
    {
        key: 'status',
        header: t('dashboard.events.columnStatus'),
        sortable: true,
        render: event => <StatusBadge status={event.status} />,
    },
    {
        key: 'location',
        header: t('dashboard.events.columnLocation'),
        render: event => (
            <span className="text-xs text-tertiary">{event.locationIsOnline ? t('dashboard.events.locationOnline') : (event.locationCity ?? '—')}</span>
        ),
    },
    {
        key: 'startDate',
        header: t('dashboard.events.columnStart'),
        sortable: true,
        render: event => <span className="text-xs text-tertiary">{formatDate(event.startDate)}</span>,
    },
    {
        key: 'actions',
        header: t('dashboard.events.columnActions'),
        render: event => (
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onEdit(event);
                    }}
                    className="p-1.5 border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                    aria-label={t('dashboard.events.editAriaLabel')}
                >
                    <Pencil size={14} />
                </button>
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        onDelete(event);
                    }}
                    className="p-1.5 border rounded-xs border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label={t('dashboard.events.deleteAriaLabel')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        ),
    },
];

const AdminEventList = ({ events, page, totalPages, isLoading, onPageChange, onEdit, onDelete }: AdminEventListProps) => {
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
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminEventList;
