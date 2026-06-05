import { ROUTES } from '@shared/constant/ROUTES';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { BG_CLASS, useChapterReader } from '../model/useChapterReader';
import { BottomToolbar } from './parts/BottomToolbar';
import { ConfigDrawer } from './parts/ConfigDrawer';
import { ReaderChrome } from './parts/ReaderChrome';
import { ReadingArea } from './parts/ReadingArea';

const Chapter = () => {
    const { titleId, chapter } = useParams();
    const navigate = useAppNavigate();
    const { t } = useTranslation('manga');

    const reader = useChapterReader(titleId, chapter);

    const navToTitle = () => navigate(ROUTES.TITLE_DETAIL(titleId));
    const navToChapter = (n: number) => navigate(ROUTES.CHAPTER(titleId, n));

    return (
        <div className={`relative min-h-screen ${BG_CLASS[reader.bg]}`}>
            <main aria-label={t('reader.readerLandmarkAria')}>
                <ReaderChrome
                    ref={reader.chromeRef}
                    titleId={titleId}
                    chNum={reader.chNum}
                    page={reader.page}
                    saved={reader.saved}
                    onBack={navToTitle}
                    onSaveToggle={() => reader.setSaved(s => !s)}
                    onCommentsToggle={() => reader.setCommentsOpen(o => !o)}
                    onOpenSettings={() => reader.setDrawerOpen(true)}
                />

                <ReadingArea
                    mode={reader.mode}
                    dir={reader.dir}
                    fit={reader.fit}
                    chNum={reader.chNum}
                    page={reader.page}
                    isEnd={reader.isEnd}
                    titleId={titleId}
                    ratingGiven={reader.ratingGiven}
                    comment={reader.comment}
                    onPrevPage={reader.prevPage}
                    onNextPage={reader.nextPage}
                    onRate={reader.setRatingGiven}
                    onComment={reader.setComment}
                    onNavigateNext={() => navToChapter(Number(reader.chNum) + 1)}
                    onNavigateBack={navToTitle}
                />

                <BottomToolbar
                    ref={reader.bottomRef}
                    page={reader.page}
                    progress={reader.progress}
                    chNum={reader.chNum}
                    titleId={titleId}
                    onPrevPage={reader.prevPage}
                    onNextPage={reader.nextPage}
                    onScrub={reader.setPage}
                    onPrevChapter={() => navToChapter(Number(reader.chNum) - 1)}
                    onNextChapter={() => navToChapter(Number(reader.chNum) + 1)}
                />

                <ConfigDrawer
                    open={reader.drawerOpen}
                    onClose={() => reader.setDrawerOpen(false)}
                    mode={reader.mode}
                    dir={reader.dir}
                    fit={reader.fit}
                    bg={reader.bg}
                    onMode={reader.setMode}
                    onDir={reader.setDir}
                    onFit={reader.setFit}
                    onBg={reader.setBg}
                />
            </main>

            <div className="h-14" />
        </div>
    );
};

export default Chapter;
