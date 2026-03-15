import { useCallback, useEffect, useState } from 'react';

import { type EnrichedProfile } from '../type/user.types';
import {
    getEnrichedProfile,
    getMyEnrichedProfile,
} from '../service/userService';

type UseEnrichedProfileReturn = {
    profile: EnrichedProfile | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
};

const useEnrichedProfile = (userId?: string): UseEnrichedProfileReturn => {
    const [profile, setProfile] = useState<EnrichedProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = userId
                ? await getEnrichedProfile(userId)
                : await getMyEnrichedProfile();
            setProfile(data);
        } catch {
            setError('Não foi possível carregar o perfil.');
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { profile, loading, error, refetch: fetch };
};

export default useEnrichedProfile;
