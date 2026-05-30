import { useTranslation } from 'react-i18next';

import { Select } from '@ui/Select';

import { CHAPTER_OPTIONS } from '../constant/chapterOptions';

type ChapterNavigationProps = {
    chapterId: string;
    onChapterChange: (value: string) => void;
    menuPlacement?: 'auto' | 'bottom' | 'top';
};

const ChapterNavigation = ({ chapterId, onChapterChange }: ChapterNavigationProps) => {
    const { t } = useTranslation('manga');

    return (
        <div className="flex flex-col gap-2">
            <Select value={chapterId} onChange={e => onChapterChange(e.target.value)} options={CHAPTER_OPTIONS} placeholder={t('chapter.loadingOptions')} />
            <div className="flex gap-2">
                <button className="p-2 border rounded-xs bg-secondary border-tertiary grow">{t('chapter.previous')}</button>
                <button className="p-2 border rounded-xs bg-secondary border-tertiary grow">{t('chapter.next')}</button>
            </div>
        </div>
    );
};

export default ChapterNavigation;
