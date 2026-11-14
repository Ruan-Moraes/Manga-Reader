import { useInterfaceLang } from './useInterfaceLang';
import { useReadingLangs } from './useReadingLangs';
import { useSettingsSync, type SettingsSyncStatus } from './useSettingsSync';

export type { SettingsSyncStatus };

/**
 * Estado da tela de configurações do sistema. Compõe três responsabilidades coesas:
 * - {@link useSettingsSync} — preferências do sistema (live em localStorage + sync com api, debounced);
 * - {@link useInterfaceLang} — idioma da interface (client-only, exige reload);
 * - {@link useReadingLangs} — idiomas de leitura (`contentLocales`).
 */
export function useSettingsState() {
    const { settings, updateGroup, isLoggedIn, syncStatus, retrySync } = useSettingsSync();
    const { interfaceLang, changeInterfaceLang, needsReload, reload } = useInterfaceLang();
    const { readingLangs, setReadingLangs } = useReadingLangs(isLoggedIn);

    return {
        settings,
        updateGroup,
        isLoggedIn,
        syncStatus,
        retrySync,
        needsReload,
        reload,
        interfaceLang,
        changeInterfaceLang,
        readingLangs,
        setReadingLangs,
    };
}

export type SettingsState = ReturnType<typeof useSettingsState>;

export default useSettingsState;
