import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Pencil } from 'lucide-react';

import { Button } from '@ui/Button';
import { Tabs } from '@ui/Tabs';
import { StatusPill } from '@ui/StatusPill';
import { Skeleton } from '@ui/Skeleton';
import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { formatDateTime as formatDateTimeIntl, getLocale } from '@shared/lib/formatters';
import {
    CHAPTER_STATUS_TONE,
    ChapterFormModal,
    ChapterMetricsPanel,
    ChapterPageGrid,
    statusLabelKey,
    toneFor,
    useAdminChapterDetail,
    useAdminChapterPagesActions,
} from '@features/admin';

type DetailTab = 'details' | 'pages' | 'metrics';

const formatDateTime = (date: string | null) => (date && formatDateTimeIntl(date)) || '—';

/** Detalhe do capítulo: metadados, gestão de páginas e métricas, com prévia no leitor real. */
const DashboardChapterDetail = () => {
    const { chapterId } = useParams();
    const { t } = useTranslation('admin');
    const appNavigate = useAppNavigate();

    const [tab, setTab] = useState<DetailTab>('details');
    const [editOpen, setEditOpen] = useState(false);

    const { chapter, pages, isLoading } = useAdminChapterDetail(chapterId);
    const pagesActions = useAdminChapterPagesActions(chapterId ?? '');

    if (isLoading || !chapter) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    const infoRows: [string, string][] = [
        [t('dashboard.chapters.detail.titleName'), chapter.titleName],
        [t('dashboard.chapters.columnNumber'), chapter.number],
        [t('dashboard.chapters.form.displayOrder'), String(chapter.displayOrder)],
        [t('dashboard.chapters.columnPages'), `${chapter.readyPagesCount}/${chapter.pagesCount}`],
        [t('dashboard.chapters.columnPublishedAt'), formatDateTime(chapter.publishedAt)],
        [t('dashboard.chapters.detail.scheduledAt'), formatDateTime(chapter.scheduledAt)],
        [t('dashboard.chapters.detail.createdAt'), formatDateTime(chapter.createdAt)],
        [t('dashboard.chapters.columnUpdatedAt'), formatDateTime(chapter.updatedAt)],
        [t('dashboard.chapters.detail.createdBy'), chapter.createdBy],
        [t('dashboard.chapters.columnReads'), chapter.reads.toLocaleString(getLocale())],
    ];

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => appNavigate(ROUTES.DASHBOARD_CHAPTERS)}>
                    {t('common.back')}
                </Button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-[24px] font-mr-extrabold leading-tight text-mr-fg md:text-[28px]">
                        <span className="text-mr-accent">#{chapter.number}</span> {chapter.title}
                    </h1>
                    <p className="mt-1 text-mr-small text-mr-fg-subtle">{chapter.titleName}</p>
                </div>
                <StatusPill tone={toneFor(CHAPTER_STATUS_TONE, chapter.status)}>{t(statusLabelKey('chapter', chapter.status), { defaultValue: chapter.status })}</StatusPill>
                <Button variant="raised" size="sm" icon={Eye} onClick={() => appNavigate(`${ROUTES.CHAPTER(chapter.titleId, chapter.number)}?preview=1`)}>
                    {t('dashboard.chapters.detail.preview')}
                </Button>
                <Button variant="primary" size="sm" icon={Pencil} onClick={() => setEditOpen(true)}>
                    {t('common.edit')}
                </Button>
            </div>

            <Tabs
                items={[
                    { value: 'details', label: t('dashboard.chapters.detail.tabDetails') },
                    { value: 'pages', label: t('dashboard.chapters.detail.tabPages'), badge: chapter.pagesCount },
                    { value: 'metrics', label: t('dashboard.chapters.detail.tabMetrics') },
                ]}
                value={tab}
                onChange={value => setTab(value as DetailTab)}
            />

            {tab === 'details' && (
                <div className="rounded-mr-md border border-mr-border bg-mr-surface p-5">
                    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                        {infoRows.map(([label, value]) => (
                            <div key={label} className="flex items-baseline justify-between gap-4 border-b border-mr-gray-900 pb-2 last:border-b-0">
                                <dt className="text-mr-small text-mr-fg-subtle">{label}</dt>
                                <dd className="text-right text-mr-small font-mr-bold text-mr-fg">{value}</dd>
                            </div>
                        ))}
                    </dl>
                    {chapter.description && (
                        <div className="mt-4 rounded-mr-sm border border-mr-border bg-mr-surface-muted p-3.5">
                            <p className="mb-1 text-mr-tiny font-mr-bold uppercase tracking-mr text-mr-fg-subtle">{t('dashboard.chapters.form.description')}</p>
                            <p className="text-mr-small leading-relaxed text-mr-fg-muted">{chapter.description}</p>
                        </div>
                    )}
                </div>
            )}

            {tab === 'pages' && (
                <ChapterPageGrid
                    pages={pages}
                    isSubmitting={pagesActions.isSubmitting}
                    onAddPages={files => void pagesActions.addPages(files)}
                    onRemovePage={pageId => void pagesActions.removePage(pageId)}
                    onRemovePages={pageIds => void pagesActions.removePages(pageIds)}
                    onReplacePage={(pageId, file) => void pagesActions.replacePage(pageId, file)}
                    onReorder={orderedIds => void pagesActions.reorderPages(orderedIds)}
                    onMovePage={(pageId, position) => void pagesActions.movePage(pageId, position)}
                    onRetryPage={pageId => void pagesActions.retryPage(pageId)}
                />
            )}

            {tab === 'metrics' && <ChapterMetricsPanel chapterId={chapter.id} titleId={chapter.titleId} />}

            <ChapterFormModal isOpen={editOpen} onClose={() => setEditOpen(false)} chapterId={chapter.id} onSaved={() => setEditOpen(false)} />
        </div>
    );
};

export default DashboardChapterDetail;
