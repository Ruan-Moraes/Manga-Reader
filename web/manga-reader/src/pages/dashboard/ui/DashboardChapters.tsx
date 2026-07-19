import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, ListOrdered } from 'lucide-react';

import { Button } from '@ui/Button';
import { Select } from '@ui/Select';
import Input from '@ui/Input';
import { ROUTES } from '@shared/constant/ROUTES';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { CHAPTER_STATUSES, CHAPTER_STORE_KEY, chapterAdminGateway, readLegacyChapterImport,
    type AdminChapter, type ChapterStatus, type LegacyChapterReadResult } from '@entities/chapter';
import {
    AdminChapterList,
    BulkChapterStatusModal,
    ChapterFormModal,
    ConfirmDeleteWithIdModal,
    ConfirmModal,
    ReorderChaptersModal,
    useAdminChapterActions,
    useAdminChapters,
    useChapterSelection,
} from '@features/admin';

import ListPageHeader from './parts/ListPageHeader';

/**
 * Gestão de capítulos: lista geral com filtros server-side (obra via
 * `?titleId=`, status, período), ações em lote, reordenação por obra.
 */
const DashboardChapters = () => {
    const { t } = useTranslation('admin');
    const appNavigate = useAppNavigate();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const titleId = searchParams.get('titleId') ?? undefined;

    const initialFilters = useMemo(() => ({ titleId }), [titleId]);
    const list = useAdminChapters(initialFilters);
    const actions = useAdminChapterActions();
    const selection = useChapterSelection();

    const [searchInput, setSearchInput] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AdminChapter | null>(null);
    const [deleting, setDeleting] = useState<AdminChapter | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
    const [reorderOpen, setReorderOpen] = useState(false);
    const [legacy, setLegacy] = useState<LegacyChapterReadResult>(() => readLegacyChapterImport());
    const [legacyConfirmOpen, setLegacyConfirmOpen] = useState(false);
    const [legacyImporting, setLegacyImporting] = useState(false);
    const [legacyError, setLegacyError] = useState<string | null>(null);

    // Conjunto COMPLETO de capítulos da obra — a reordenação é atômica e não
    // pode operar sobre uma página parcial da listagem.
    const { data: reorderSet } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_CHAPTERS, 'reorder-set', titleId],
        queryFn: () => chapterAdminGateway.list({ page: 0, size: 1000, titleId }),
        enabled: reorderOpen && !!titleId,
    });

    const submitSearch = () => {
        list.setSearch(searchInput);
        list.setPage(0);
    };

    const updateFilters = (partial: Parameters<typeof list.setFilters>[0]) => {
        list.setFilters({ ...list.filters, ...partial });
        selection.clear();
    };

    // A URL é a fonte de verdade do filtro de obra. Navegar do sidebar
    // (?titleId=X → sem param) NÃO remonta a página — sem esta sincronização
    // o filtro antigo ficaria preso, invisível, no estado do hook.
    const lastSyncedTitleId = useRef(titleId);
    useEffect(() => {
        if (lastSyncedTitleId.current === titleId) return;
        lastSyncedTitleId.current = titleId;
        updateFilters({ titleId });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [titleId]);

    const setTitleFilter = (next: string) => {
        setSearchParams(prev => {
            const params = new URLSearchParams(prev);
            if (next) params.set('titleId', next);
            else params.delete('titleId');
            return params;
        });
    };

    const openNew = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (chapter: AdminChapter) => {
        setEditing(chapter);
        setFormOpen(true);
    };

    const confirmDelete = async () => {
        if (deleting) await actions.handleDelete(deleting.id);
        setDeleting(null);
    };

    const confirmBulkDelete = async () => {
        await actions.handleBulkDelete(selection.selectedIds);
        selection.clear();
        setBulkDeleteOpen(false);
    };

    const confirmBulkStatus = async (status: ChapterStatus) => {
        const result = await actions.handleBulkChangeStatus(selection.selectedIds, status);
        if (result) selection.clear();
        return result;
    };

    const confirmReorder = async (orderedIds: string[]) => {
        if (!titleId) return;
        await actions.handleReorder(titleId, orderedIds);
        setReorderOpen(false);
    };

    const confirmLegacyImport = async () => {
        if (legacy.kind !== 'ready') return;
        setLegacyImporting(true);
        setLegacyError(null);
        try {
            const result = await chapterAdminGateway.importLegacy(legacy.preview.payload);
            if (result.rejected.length) {
                setLegacyError(t('dashboard.chapters.legacy.partial', { count: result.rejected.length }));
                return;
            }
            window.localStorage.removeItem(CHAPTER_STORE_KEY);
            setLegacy({ kind: 'none' });
            setLegacyConfirmOpen(false);
            await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CHAPTERS] });
        } catch {
            setLegacyError(t('dashboard.chapters.legacy.error'));
        } finally {
            setLegacyImporting(false);
        }
    };

    const statusFilterOptions = [
        { value: '', label: t('dashboard.chapters.filters.allStatuses') },
        ...CHAPTER_STATUSES.map(status => ({ value: status, label: t(`dashboard.status.chapter.${status}`) })),
    ];

    return (
        <div className="flex flex-col gap-4">
            <ListPageHeader
                title={t('dashboard.chapters.title')}
                subtitle={titleId ? t('dashboard.chapters.filteredByTitle') : undefined}
                count={t('dashboard.chapters.count', { count: list.totalElements })}
                onNew={openNew}
                newLabel={t('dashboard.chapters.new')}
                searchValue={searchInput}
                onSearchChange={setSearchInput}
                onSubmitSearch={submitSearch}
                searchPlaceholder={t('dashboard.chapters.search')}
                searchButtonLabel={t('common.search')}
            />

            {legacy.kind !== 'none' && (
                <div className="rounded-mr-sm border border-mr-border bg-mr-surface-muted p-3.5" role="status">
                    {legacy.kind === 'ready' ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-mr-small font-mr-bold text-mr-fg">{t('dashboard.chapters.legacy.title')}</p>
                                <p className="mt-1 text-mr-tiny text-mr-fg-subtle">
                                    {t('dashboard.chapters.legacy.preview', { chapters: legacy.preview.chaptersCount,
                                        pages: legacy.preview.pagesCount, ignored: legacy.preview.ignoredDeletedCount })}
                                </p>
                                {legacyError && <p className="mt-1 text-mr-tiny text-mr-danger">{legacyError}</p>}
                            </div>
                            <Button size="sm" variant="primary" onClick={() => setLegacyConfirmOpen(true)}>
                                {t('dashboard.chapters.legacy.import')}
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-mr-small font-mr-bold text-mr-danger">{t('dashboard.chapters.legacy.invalidTitle')}</p>
                            <p className="mt-1 text-mr-tiny text-mr-fg-subtle">{legacy.reason}</p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1.5">
                    <span className="text-mr-tiny font-mr-bold text-mr-fg-muted">{t('dashboard.chapters.filters.status')}</span>
                    <Select
                        value={list.filters.status?.[0] ?? ''}
                        onChange={e => updateFilters({ status: e.target.value ? [e.target.value as ChapterStatus] : undefined })}
                        options={statusFilterOptions}
                        aria-label={t('dashboard.chapters.filters.status')}
                        className="min-w-[170px]"
                    />
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-mr-tiny font-mr-bold text-mr-fg-muted">{t('dashboard.chapters.filters.publishedFrom')}</span>
                    <Input
                        type="date"
                        value={list.filters.publishedFrom?.slice(0, 10) ?? ''}
                        onChange={e => updateFilters({ publishedFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined })}
                    />
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-mr-tiny font-mr-bold text-mr-fg-muted">{t('dashboard.chapters.filters.publishedTo')}</span>
                    <Input
                        type="date"
                        value={list.filters.publishedTo?.slice(0, 10) ?? ''}
                        onChange={e => updateFilters({ publishedTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined })}
                    />
                </label>

                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {titleId && (
                        <>
                            <Button variant="raised" size="sm" icon={ListOrdered} onClick={() => setReorderOpen(true)}>
                                {t('dashboard.chapters.reorder.open')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setTitleFilter('')}>
                                {t('dashboard.chapters.filters.clearTitle')}
                            </Button>
                        </>
                    )}
                    <Button variant="raised" size="sm" icon={BarChart3} onClick={() => appNavigate(ROUTES.DASHBOARD_CHAPTERS_ANALYTICS)}>
                        {t('dashboard.chapters.analyticsLink')}
                    </Button>
                </div>
            </div>

            <AdminChapterList
                chapters={list.chapters}
                page={list.page}
                totalPages={list.totalPages}
                isLoading={list.isLoading}
                isError={list.isError}
                onRetry={() => void list.refetch()}
                onPageChange={list.setPage}
                onEdit={openEdit}
                onDuplicate={chapter => void actions.handleDuplicate(chapter.id)}
                onDelete={setDeleting}
                onRowClick={chapter => appNavigate(ROUTES.DASHBOARD_CHAPTER_DETAIL(chapter.id))}
                sort={list.sort}
                direction={list.direction}
                onSortChange={(sort, direction) => {
                    list.setSort(sort);
                    list.setDirection(direction);
                    list.setPage(0);
                }}
                selectedKeys={selection.selected}
                onToggleRow={selection.toggle}
                onToggleAll={selection.toggleAll}
                onBulkStatus={() => setBulkStatusOpen(true)}
                onBulkDelete={() => setBulkDeleteOpen(true)}
                onClearSelection={selection.clear}
            />

            <ChapterFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                chapterId={editing?.id ?? null}
                presetTitleId={titleId}
                presetTitleName={list.chapters.find(c => c.titleId === titleId)?.titleName}
                onSaved={() => setFormOpen(false)}
            />

            <ReorderChaptersModal
                isOpen={reorderOpen}
                onClose={() => setReorderOpen(false)}
                chapters={reorderSet?.content ?? []}
                isSubmitting={actions.isSubmitting}
                onConfirm={confirmReorder}
            />

            <BulkChapterStatusModal
                isOpen={bulkStatusOpen}
                onClose={() => setBulkStatusOpen(false)}
                count={selection.count}
                isSubmitting={actions.isSubmitting}
                onConfirm={confirmBulkStatus}
            />

            <ConfirmDeleteWithIdModal
                isOpen={deleting !== null}
                onClose={() => setDeleting(null)}
                onConfirm={confirmDelete}
                entityId={deleting?.id ?? ''}
                title={t('dashboard.chapters.deleteTitle')}
                message={t('dashboard.chapters.deleteConfirm')}
                isSubmitting={actions.isSubmitting}
            />

            <ConfirmModal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                onConfirm={() => void confirmBulkDelete()}
                title={t('dashboard.chapters.bulk.deleteTitle')}
                message={t('dashboard.chapters.bulk.deleteConfirm', { count: selection.count })}
                confirmLabel={t('dashboard.chapters.bulk.delete')}
                danger
                isSubmitting={actions.isSubmitting}
            />

            <ConfirmModal
                isOpen={legacyConfirmOpen}
                onClose={() => setLegacyConfirmOpen(false)}
                onConfirm={() => void confirmLegacyImport()}
                title={t('dashboard.chapters.legacy.confirmTitle')}
                message={legacy.kind === 'ready' ? t('dashboard.chapters.legacy.confirmMessage', {
                    chapters: legacy.preview.chaptersCount, pages: legacy.preview.pagesCount }) : ''}
                confirmLabel={t('dashboard.chapters.legacy.import')}
                isSubmitting={legacyImporting}
            />
        </div>
    );
};

export default DashboardChapters;
