import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { useTitle } from '@entities/manga';
import { useChapter } from '@entities/chapter';

import { useChapterReader } from '../model/useChapterReader';
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

    const r = useChapterReader(titleId, chapterParam);
    const { title } = useTitle(titleId ?? '');
    const { chapter: chapterData } = useChapter(titleId, chapterParam);

    const displayTitle = title?.name ?? t('reader.untitled');
    const status = title?.status ?? '';
    const ratingAverage = title?.ratingAverage ?? 0;
    const ratingCount = title?.ratingCount ?? 0;

    const chaptersList = useMemo<ChapterListItem[]>(() => {
        const latest = Number(title?.latestChapterNumber) || title?.chaptersCount || Math.max(r.chapter, 10);
        const count = Math.min(latest, CHAPTER_WINDOW);
        return Array.from({ length: count }, (_, i) => {
            const num = latest - i;
            const when = i === 0 ? t('reader.today') : i === 1 ? t('reader.yesterday') : t('reader.daysAgo', { days: i + 1 });
            return { num, title: t('reader.chapterTitle', { num }), when, isCurrent: num === r.chapter };
        });
    }, [title?.latestChapterNumber, title?.chaptersCount, r.chapter, t]);

    const goForum = () => navigate(ROUTES.FORUM);

    const endProps = {
        chapter: r.chapter,
        rating: r.rating,
        onRate: r.setRating,
        ratingAverage,
        ratingCount,
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

                <ReadingArea
                    mode={r.mode}
                    direction={r.direction}
                    fit={r.fit}
                    gap={r.gap}
                    chapter={r.chapter}
                    page={r.page}
                    listRef={r.listRef}
                    end={endProps}
                />

                <ReaderRails direction={r.direction} onNext={r.goNext} onPrev={r.goPrev} />

                <ReaderBottombar
                    page={r.page}
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
