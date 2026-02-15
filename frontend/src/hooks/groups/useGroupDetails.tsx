import { useEffect, useMemo, useState } from 'react';

import { getGroupById } from '../../services/mock/mockGroupService';

const useGroupDetails = (groupId?: string) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        setIsLoading(true);

        const timeout = setTimeout(() => setIsLoading(false), 300);

        return () => clearTimeout(timeout);
    }, [groupId]);

    const group = useMemo(() => {
        if (!groupId) return null;

        return getGroupById(groupId) ?? null;
    }, [groupId]);

    return {
        group,
        isLoading,
    };
};

export default useGroupDetails;
