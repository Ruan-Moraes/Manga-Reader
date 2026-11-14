import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSettingsToast } from './useSettingsToast';

/**
 * Idioma da interface — client-only (i18n + localStorage). Trocar exige reload da app para
 * reidratar todos os namespaces; expõe o flag `needsReload` e a ação `reload`.
 */
export const useInterfaceLang = () => {
    const { i18n } = useTranslation('user');
    const fireToast = useSettingsToast();

    const [needsReload, setNeedsReload] = useState(false);

    const interfaceLang = i18n.language;

    const changeInterfaceLang = useCallback(
        (lang: string, toastTitle: string) => {
            void i18n.changeLanguage(lang);
            setNeedsReload(true);
            fireToast(toastTitle);
        },
        [i18n, fireToast],
    );

    return {
        interfaceLang,
        changeInterfaceLang,
        needsReload,
        reload: () => window.location.reload(),
    };
};

export default useInterfaceLang;
