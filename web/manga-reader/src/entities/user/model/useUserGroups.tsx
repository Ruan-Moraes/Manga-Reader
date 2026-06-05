import { useCallback, useEffect, useState } from 'react';

import { getMyGroups, joinGroup, leaveGroup, type UserGroups } from '../api/userService';

type UseUserGroupsReturn = {
    groups: UserGroups;
    loading: boolean;
    error: string | null;
    /** Vincula o usuário ao grupo (otimista) e ressincroniza com o api. */
    link: (groupId: string) => Promise<void>;
    /** Desvincula o usuário do grupo (otimista) e ressincroniza com o api. */
    unlink: (groupId: string) => Promise<void>;
};

const EMPTY: UserGroups = { linked: [], available: [] };

const useUserGroups = (enabled: boolean): UseUserGroupsReturn => {
    const [groups, setGroups] = useState<UserGroups>(EMPTY);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);
        try {
            setGroups(await getMyGroups());
        } catch {
            setError('Não foi possível carregar os grupos.');
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const link = useCallback(async (groupId: string) => {
        await joinGroup(groupId);
        setGroups(await getMyGroups());
    }, []);

    const unlink = useCallback(async (groupId: string) => {
        await leaveGroup(groupId);
        setGroups(await getMyGroups());
    }, []);

    return { groups, loading, error, link, unlink };
};

export default useUserGroups;
