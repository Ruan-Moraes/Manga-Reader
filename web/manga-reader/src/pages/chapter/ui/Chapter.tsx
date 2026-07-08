import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { EmptyState } from '@ui/EmptyState';
import { useAuth } from '@features/auth';
import { useTitle } from '@entities/manga';
import { useChapter } from '@entities/chapter';
import { recordChapterRead } from '@entities/user';

import { useChapterReader } from '../model/useChapterReader';
import useReaderPages from '../model/useReaderPages';
import type { ChapterListItem } from './parts/ChapterDropdown';
import { ReaderBottombar } from './parts/ReaderBottombar';
import { ReaderCommentsPanel } from './parts/ReaderCommentsPanel';
import { ReaderDrawer } from './parts/ReaderDrawer';
import { ReaderRails } from './parts/ReaderRails';
import { ReaderTopbar } from './parts/ReaderTopbar';
import { ReadingArea } from './parts/ReadingArea';
import './reader.css';

const CHAPTER_WINDOW = 50;

const Chapter = () => {
    const { titleId, chapter: chapterParam } = useParams();
    const { t } = useTranslation('manga');
    const navigate = useAppNavigate();

    const { isLoggedIn, user } = useAuth();
    const [searchParams] = useSearchParams();

    // Prévia de capítulo não publicado: somente admin/poster com ?preview=1.
    const isPreview = searchParams.get('preview') === '1' && (user?.role === 'admin' || user?.role === 'poster');

    const { title } = useTitle(titleId ?? '');
    const { readerChapter, isBlocked } = useReaderPages(titleId, chapterParam, isPreview);
    const maxChapter = Number(title?.latestChapterNumber) || title?.chaptersCount || undefined;
    const r = useChapterReader(titleId, chapterParam, maxChapter, readerChapter?.pages.length);
    const { chapter: chapterData } = useChapter(titleId, chapterParam);

    // Marca o capítulo como lido (fire-and-forget; idempotente no backend). Só
    // para usuário autenticado e quando o capítulo realmente carregou.
    useEffect(() => {
        if (!isLoggedIn || !titleId || !chapterParam || !chapterData) return;
        void recordChapterRead(titleId, chapterParam).catch(() => {});
    }, [isLoggedIn, titleId, chapterParam, chapterData]);

    const displayTitle = title?.name ?? t('reader.untitled');
    const status = title?.status ?? '';
    const ratingAverage = title?.ratingAverage ?? 0;
    const ratingCount = title?.ratingCount ?? 0;

    const chaptersList = useMemo<ChapterListItem[]>(() => {
        const latest = Number(title?.latestChapterNumber) || title?.chaptersCount || r.chapter;
        const count = Math.min(latest, CHAPTER_WINDOW);
        return Array.from({ length: count }, (_, i) => {
            const num = latest - i;
            const when = i === 0 ? t('reader.today') : i === 1 ? t('reader.yesterday') : t('reader.daysAgo', { days: i + 1 });
            return { num, title: t('reader.chapterTitle', { num }), when, isCurrent: num === r.chapter };
        });
    }, [title?.latestChapterNumber, title?.chaptersCount, r.chapter, t]);

    const goForum = () => navigate(ROUTES.FORUM);

    // Capítulo existente porém não-público (oculto/indisponível/arquivado):
    // fora do preview admin, o leitor não expõe o conteúdo.
    if (isBlocked) {
        return (
            <div className="reader-shell flex min-h-[60vh] items-center justify-center" data-bg={r.bg}>
                <EmptyState
                    illustration="duvida"
                    title={t('reader.chapterUnavailableTitle')}
                    description={t('reader.chapterUnavailableBody')}
                    action={undefined}
                />
            </div>
        );
    }

    const endProps = {
        chapter: r.chapter,
        rating: r.rating,
        onRate: r.setRating,
        ratingAverage,
        ratingCount,
        hasNext: r.hasNextChapter,
        onNext: () => r.switchChapter(1),
        onBack: r.goBack,
        onForum: goForum,
    };

    return (
        <div className="reader-shell" data-bg={r.bg}>
            <main aria-label={t('reader.readerLandmarkAria')}>
                <ReaderTopbar
                    title={displayTitle}
                    chapter={r.chapter}
                    page={r.page}
                    total={r.total}
                    status={status}
                    hidden={r.topbarHidden}
                    saved={r.saved}
                    chaptersOpen={r.chaptersOpen}
                    commentsOpen={r.commentsOpen}
                    settingsOpen={r.settingsOpen}
                    chaptersList={chaptersList}
                    onBack={r.goBack}
                    onToggleChapters={() => r.setChaptersOpen(o => !o)}
                    onPickChapter={r.pickChapter}
                    onToggleSaved={() => r.setSaved(s => !s)}
                    onToggleComments={() => r.setCommentsOpen(o => !o)}
                    onToggleSettings={() => r.setSettingsOpen(o => !o)}
                />

                {isPreview && (
                    <div className="pointer-events-none fixed left-1/2 top-16 z-20 -translate-x-1/2 rounded-mr-full border border-mr-accent-50 bg-mr-accent-25 px-4 py-1.5 text-mr-tiny font-mr-bold uppercase tracking-mr text-mr-accent">
                        {t('reader.previewBadge')}
                    </div>
                )}

                <ReadingArea
                    mode={r.mode}
                    direction={r.direction}
                    fit={r.fit}
                    gap={r.gap}
                    chapter={r.chapter}
                    page={r.page}
                    listRef={r.listRef}
                    end={endProps}
                    pages={readerChapter?.pages}
                />

                <ReaderRails direction={r.direction} onNext={r.goNext} onPrev={r.goPrev} />

                <ReaderBottombar
                    page={r.page}
                    total={r.total}
                    fillPct={r.fillPct}
                    hidden={r.topbarHidden}
                    onPrevPage={r.goPrev}
                    onNextPage={r.goNext}
                    onPrevChapter={() => r.switchChapter(-1)}
                    onNextChapter={() => r.switchChapter(1)}
                    onScrub={r.goToPage}
                />
            </main>

            {r.settingsOpen && (
                <ReaderDrawer
                    mode={r.mode}
                    direction={r.direction}
                    fit={r.fit}
                    gap={r.gap}
                    bg={r.bg}
                    onMode={r.setMode}
                    onDirection={r.setDirection}
                    onFit={r.setFit}
                    onGap={r.setGap}
                    onBg={r.setBg}
                    onClose={() => r.setSettingsOpen(false)}
                />
            )}

            {r.commentsOpen && (
                <ReaderCommentsPanel
                    chapter={r.chapter}
                    chapterId={chapterData?.id}
                    onClose={() => r.setCommentsOpen(false)}
                />
            )}
        </div>
    );
};

export default Chapter;
