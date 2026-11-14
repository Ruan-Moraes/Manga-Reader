import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getGroupWorks } from '../api/groupService';

const usePagedGroupWorks = (groupId: string | undefined, page: number, size = 20) =>
    useQuery({
        queryKey: [QUERY_KEYS.GROUP_WORKS, groupId, page, size],
        queryFn: ({ signal }) => getGroupWorks(groupId!, page, size, signal),
        enabled: Boolean(groupId),
        placeholderData: previous => previous,
    });

export default usePagedGroupWorks;
