import { useTranslation } from 'react-i18next';

const CHAPTER_PAGE_PLACEHOLDER = 'https://placehold.co/600x800/png';

const TOTAL_PAGES = 10;

const ChapterPages = () => {
    const { t } = useTranslation('manga');

    return (
        <section>
            <div className="flex flex-col justify-center gap-0.5">
                {Array.from({ length: TOTAL_PAGES }, (_, i) => (
                    <div key={i}>
                        <img
                            src={CHAPTER_PAGE_PLACEHOLDER}
                            alt={t('chapter.pageAlt', { number: i + 1 })}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ChapterPages;
