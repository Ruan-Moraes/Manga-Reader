import { useTranslation } from 'react-i18next';
import { IoImageOutline } from 'react-icons/io5';

import { type Title } from '@feature/manga/type/title.types';

type ChapterCoverImageProps = {
    currentTitle: Title | undefined;
    isLoading: boolean;
    imageError: boolean;
    onImageError: () => void;
};

const ChapterCoverImage = ({
    currentTitle,
    isLoading,
    imageError,
    onImageError,
}: ChapterCoverImageProps) => {
    const { t } = useTranslation('manga');

    return (
        <section>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center w-full border bg-secondary h-80 rounded-xs border-tertiary">
                    {imageError && (
                        <div className="flex flex-col items-center justify-center">
                            <IoImageOutline
                                size={96}
                                className="text-tertiary"
                            />
                            <span className="mt-2 text-sm text-center text-tertiary">
                                {t('chapter.coverError')}
                            </span>
                        </div>
                    )}
                    {!imageError && isLoading && (
                        <div>
                            <span className="object-cover w-full rounded-md h-80">
                                {t('chapter.coverLoading')}
                            </span>
                        </div>
                    )}
                    {!imageError && !isLoading && (
                        <img
                            src={currentTitle?.cover}
                            alt={currentTitle?.name}
                            onError={onImageError}
                            className="object-cover w-full rounded-md h-80"
                        />
                    )}
                </div>
            </div>
        </section>
    );
};

export default ChapterCoverImage;
