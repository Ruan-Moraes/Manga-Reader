import { useState } from 'react';
import { WEB_BASE_URL } from '../../shared/constant/WEB_BASE_URL';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search } from 'lucide-react';
import { AdminEventList, ConfirmDeleteWithIdModal, useAdminEvents, useAdminEventActions, type AdminEvent } from '@features/admin';

const DashboardEvents = () => {
    const { t } = useTranslation('admin');
    const { events, page, totalPages, totalElements, isLoading, search, setSearch, setPage } = useAdminEvents();
    const { isSubmitting, handleDelete } = useAdminEventActions();

    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState(search);
    const [deletingEvent, setDeletingEvent] = useState<AdminEvent | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(0);
    };

    const confirmDelete = async () => {
        if (deletingEvent) {
            await handleDelete(deletingEvent.id);
            setDeletingEvent(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">{t('dashboard.events.title')}</h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-tertiary">{t('dashboard.events.count', { count: totalElements })}</span>
                    <button
                        onClick={() => navigate(`${WEB_BASE_URL}/dashboard/events/new`)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-dark"
                    >
                        <Plus size={14} />
                        {t('dashboard.events.new')}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute text-tertiary left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder={t('dashboard.events.search')}
                        className="w-full py-2 pl-9 pr-3 text-sm border rounded-xs bg-secondary border-tertiary"
                    />
                </div>
                <button type="submit" className="px-4 py-2 text-sm font-semibold border rounded-xs border-tertiary hover:bg-tertiary/30">
                    {t('common.search')}
                </button>
            </form>

            <AdminEventList
                events={events}
                page={page}
                totalPages={totalPages}
                isLoading={isLoading}
                onPageChange={setPage}
                onEdit={event => navigate(`${WEB_BASE_URL}/dashboard/events/${event.id}/edit`)}
                onDelete={setDeletingEvent}
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
