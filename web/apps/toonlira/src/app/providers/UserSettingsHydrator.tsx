import { useEffect } from 'react';

import { applySystemPreferences, setAdultContentPreference, useUserSettings, writeStoredUserSettings } from '@entities/user';
import { useAuth } from '@features/auth';

/**
 * Hidrata as preferências autenticadas fora da rota de configurações. Assim
 * tema, acessibilidade e leitor usam o servidor como fonte persistida em todo
 * o aplicativo, inclusive após reload direto em outra rota.
 */
export const UserSettingsHydrator = () => {
    const { isLoggedIn, user } = useAuth();
    const { query } = useUserSettings(isLoggedIn, user?.id);

    useEffect(() => {
        setAdultContentPreference(user?.adultContentPreference);
    }, [user?.adultContentPreference]);

    useEffect(() => {
        if (!query.data) return;
        writeStoredUserSettings(query.data);
        applySystemPreferences(query.data);
    }, [query.data]);

    return null;
};

export default UserSettingsHydrator;
