import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    AdminEventList,
    EventFormModal,
    ConfirmDeleteWithIdModal,
    useAdminEvents,
    useAdminEventActions,
    type AdminEvent,
    type CreateEventRequest,
    type UpdateEventRequest,
} from '@features/admin';
import ListPageHeader from './parts/ListPageHeader';

const DashboardEvents = () => {
    const { t } = useTranslation('admin');
    const { events, page, totalPages, totalElements, isLoading, search, setSearch, setPage } = useAdminEvents();
    const { isSubmitting, handleCreate, handleUpdate, handleDelete } = useAdminEventActions();

    const [searchInput, setSearchInput] = useState(search);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AdminEvent | null>(null);
    const [deletingEvent, setDeletingEvent] = useState<AdminEvent | null>(null);

    const submitSearch = () => {
        setSearch(searchInput);
        setPage(0);
    };

    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (event: AdminEvent) => {
        setEditing(event);
        setFormOpen(true);
    };

    const handleFormSubmit = async (data: CreateEventRequest | UpdateEventRequest) => {
        const result = editing ? await handleUpdate(editing.id, data) : await handleCreate(data as CreateEventRequest);
        if (result) setFormOpen(false);
    };

    const confirmDelete = async () => {
        if (deletingEvent) {
            await handleDelete(deletingEvent.id);
            setDeletingEvent(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <ListPageHeader
                title={t('dashboard.events.title')}
                count={t('dashboard.events.count', { count: totalElements })}
                onNew={openNew}
                newLabel={t('dashboard.events.new')}
                searchValue={searchInput}
                onSearchChange={setSearchInput}
                onSubmitSearch={submitSearch}
                searchPlaceholder={t('dashboard.events.search')}
                searchButtonLabel={t('common.search')}
            />

            <AdminEventList
                events={events}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={openEdit}
                onRowClick={openEdit}
                onDelete={setDeletingEvent}
            />

            <EventFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                event={editing}
                isSubmitting={isSubmitting}
                onDelete={() => {
                    setDeletingEvent(editing);
                    setFormOpen(false);
                }}
            />

            <ConfirmDeleteWithIdModal
                isOpen={deletingEvent !== null}
                onClose={() => setDeletingEvent(null)}
                onConfirm={confirmDelete}
                entityId={deletingEvent?.id ?? ''}
                title={t('dashboard.events.deleteTitle')}
                message={t('dashboard.events.deleteConfirm')}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default DashboardEvents;
