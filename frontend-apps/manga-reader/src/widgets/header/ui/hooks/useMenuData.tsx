import { useQuery } from '@tanstack/react-query';

import { getLibraryCounts } from '@features/library';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

const useMenuData = (isLoggedIn: boolean) => {
    const { data: libraryCounts } = useQuery({
        queryKey: [QUERY_KEYS.LIBRARY_COUNTS],
        queryFn: getLibraryCounts,
        staleTime: FIVE_MINUTES,
        gcTime: TEN_MINUTES,
        enabled: isLoggedIn,
    });

    return {
        savedCount: libraryCounts?.total,
    };
};

export default useMenuData;
