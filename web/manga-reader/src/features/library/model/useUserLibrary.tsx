import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getUserLibrary, getUserLibraryById, getUserLibraryByList } from '../api/libraryService';
import { type ReadingListType } from './saved-library.types';

/**
 * Biblioteca de um usuário para a página de perfil.
 * - `userId` definido → biblioteca pública daquele usuário (`/api/library/user/{id}`);
 * - `userId` ausente → biblioteca do usuário logado (`/api/library`).
 *
 * Substitui o mock de "lendo"/"concluído" do perfil.
 */
const useUserLibrary = (userId: string | undefined, list?: ReadingListType) => {
    const query = useQuery({
        queryKey: [QUERY_KEYS.LIBRARY_BY_USER, userId ?? 'me', list ?? 'all'],
        queryFn: () => {
            if (userId) return getUserLibraryById(userId, list);

            return list ? getUserLibraryByList(list) : getUserLibrary();
        },
        staleTime: 1000 * 60,
    });

    return {
        items: query.data?.content ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
    };
};

export default useUserLibrary;
