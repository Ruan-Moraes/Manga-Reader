import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SingleValue, MultiValue } from 'react-select';
import { SelectOption } from '@shared/component/ui/StyledSelect';

import { useTitles } from '@feature/manga';

const useChapterReader = () => {
    const navigate = useNavigate();
    const { title: titleId = '', chapter: chapterId = '' } = useParams();

    const { titles, isLoading } = useTitles(titleId);

    const currentTitle =
        Array.isArray(titles) && titles.length > 0
            ? titles.find(title => String(title.id) === titleId) ||
              titles[Number(titleId)]
            : undefined;

    const isInvalidChapter = isNaN(Number(chapterId));

    const bottomNavRef = useRef<HTMLDivElement | null>(null);
    const [isBottomNavVisible, setIsBottomNavVisible] = useState(false);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const newHeight = window.innerHeight;

            if (newHeight < windowHeight) {
                setIsBottomNavVisible(true);
            }

            if (newHeight > windowHeight) {
                setIsBottomNavVisible(false);
            }

            setWindowHeight(newHeight);
        };

        if (bottomNavRef.current) {
            bottomNavRef.current.style.transform = isBottomNavVisible
                ? 'translateY(calc(0% - 0.5rem))'
                : 'translateY(calc(100%))';
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [windowHeight, isBottomNavVisible]);

    const handleChapterChange = useCallback(
        (newValue: MultiValue<SelectOption> | SingleValue<SelectOption>) => {
            if (newValue && !Array.isArray(newValue)) {
                navigate(
                    `/Manga-Reader/title/${titleId}/${(newValue as SelectOption).value}`,
                );
            }
        },
        [navigate, titleId],
    );

    return {
        titleId,
        chapterId,
        currentTitle,
        isLoading,
        isInvalidChapter,
        bottomNavRef,
        imageError,
        setImageError,
        handleChapterChange,
    };
};

export default useChapterReader;
