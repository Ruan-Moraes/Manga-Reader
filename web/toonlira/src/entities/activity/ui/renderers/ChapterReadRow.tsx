import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

import type { ActivityEvent } from '../../model/activity.types';

const ChapterReadRow = ({ event }: { event: ActivityEvent }) => {
    const { t } = useTranslation('user');

    if (event.type !== 'CHAPTER_READ') return null;

    const { titleName, chapterNumber } = event.payload;

    return (
        <>
            <BookOpen className="size-4 shrink-0 text-ui-fg-subtle" aria-hidden="true" />
            <span className="flex-1 text-ui-small text-ui-fg-muted">
                {t('profile.activity.chapterRead', { chapter: chapterNumber, title: titleName })}
            </span>
        </>
    );
};

export default ChapterReadRow;
