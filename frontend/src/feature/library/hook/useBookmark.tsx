import { useCallback } from 'react';

import { showSuccessToast } from '@shared/service/util/toastService';
import useSavedMangas from './useSavedMangas';

const useBookmark = () => {
    const { isSaved, toggleFavorite } = useSavedMangas();

    const toggleBookmark = useCallback(
        async ({
            titleId,
            name,
            cover,
            type,
        }: {
            titleId: string;
            name: string;
            cover: string;
            type: string;
        }) => {
            const nowSaved = await toggleFavorite({ titleId, name, cover, type });

            showSuccessToast(
                nowSaved
                    ? 'Título adicionado aos favoritos.'
                    : 'Título removido dos favoritos.',
            );

            return nowSaved;
        },
        [toggleFavorite],
    );

    return {
        toggleBookmark,
        isSaved,
    };
};

export default useBookmark;
