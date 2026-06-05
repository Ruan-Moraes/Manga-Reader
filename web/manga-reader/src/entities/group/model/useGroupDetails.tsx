import { useEffect, useState } from 'react';

import { getGroupById } from '../api/groupService';
import { Group } from '../model/group.types';

const useGroupDetails = (groupId?: string) => {
    const [group, setGroup] = useState<Group | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!groupId) {
            setGroup(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        getGroupById(groupId).then(data => {
            setGroup(data ?? null);
            setIsLoading(false);
        });
    }, [groupId]);

    return {
        group,
        isLoading,
    };
};

export default useGroupDetails;
