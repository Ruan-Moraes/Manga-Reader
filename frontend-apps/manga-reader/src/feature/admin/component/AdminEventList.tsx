import { useNavigate } from 'react-router-dom';

import DataTable, { type Column } from '@shared/component/table/DataTable';
import useSortableData from '@shared/hook/useSortableData';

import type { AdminEvent } from '../type/admin.types';

type AdminEventListProps = {
    events: AdminEvent[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
};

const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        HAPPENING_NOW: 'bg-green-500/20 text-green-300',
        REGISTRATIONS_OPEN: 'bg-blue-500/20 text-blue-300',
        COMING_SOON: 'bg-yellow-500/20 text-yellow-300',
        ENDED: 'bg-tertiary/30 text-tertiary',
    };

    return (
        <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-xs ${colors[status] ?? 'bg-tertiary/30'}`}
        >
            {status}
        </span>
    );
};

const columns: Column<AdminEvent>[] = [
    {
        key: 'title',
        header: 'Titulo',
        sortable: true,
        render: event => <span className="font-medium">{event.title}</span>,
    },
    {
        key: 'type',
        header: 'Tipo',
        sortable: true,
        render: event => (
            <span className="text-xs text-tertiary">{event.type}</span>
        ),
    },
    {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: event => <StatusBadge status={event.status} />,
    },
    {
        key: 'location',
        header: 'Local',
        render: event => (
            <span className="text-xs text-tertiary">
                {event.locationIsOnline
                    ? 'Online'
                    : (event.locationCity ?? '—')}
            </span>
        ),
    },
    {
        key: 'startDate',
        header: 'Inicio',
        sortable: true,
        render: event => (
            <span className="text-xs text-tertiary">
                {formatDate(event.startDate)}
            </span>
        ),
    },
];

const AdminEventList = ({
    events,
    page,
    totalPages,
    isLoading,
    onPageChange,
}: AdminEventListProps) => {
    const navigate = useNavigate();
    const { sortedData, sortBy, sortDirection, handleSort } =
        useSortableData(events);

    return (
        <DataTable
            columns={columns}
            data={sortedData}
            keyExtractor={event => event.id}
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            emptyMessage="Nenhum evento encontrado."
            onRowClick={event =>
                navigate(`/Manga-Reader/dashboard/events/${event.id}/edit`)
            }
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
        />
    );
};

export default AdminEventList;
