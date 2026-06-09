import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@ui/Toast';
import { useAuth } from '@features/auth';
import { DEFAULT_USER_SETTINGS, type UserSettings, useUserSettings, useContentLocales, applyReduceMotion, SETTINGS_STORAGE_KEY } from '@entities/user';

const STORAGE_KEY = SETTINGS_STORAGE_KEY;
const SYNC_DEBOUNCE_MS = 400;
const TOAST_DURATION_MS = 2200;

function readLocal(): UserSettings {
    if (typeof window === 'undefined') {
        return DEFAULT_USER_SETTINGS;
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return DEFAULT_USER_SETTINGS;
        }

        const parsed = JSON.parse(raw) as Partial<UserSettings>;

        // Merge raso por grupo, garantindo defaults para chaves novas.
        return {
            reader: { ...DEFAULT_USER_SETTINGS.reader, ...parsed.reader },
            appearance: { ...DEFAULT_USER_SETTINGS.appearance, ...parsed.appearance },
            locale: { ...DEFAULT_USER_SETTINGS.locale, ...parsed.locale },
            accessibility: { ...DEFAULT_USER_SETTINGS.accessibility, ...parsed.accessibility },
        };
    } catch {
        return DEFAULT_USER_SETTINGS;
    }
}

function writeLocal(settings: UserSettings) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // localStorage indisponível (modo privado): ignora silenciosamente.
    }
}

/**
 * Estado das configurações do sistema. Salva live em localStorage e sincroniza com o api quando
 * logado (debounced); dispara toast de confirmação a cada mudança. Idioma da interface e idiomas de
 * leitura são tratados à parte (i18n/localStorage e contentLocales, respectivamente).
 */
export function useSettingsState() {
    const { i18n } = useTranslation('user');
    const { toast } = useToast();
    const { isLoggedIn } = useAuth();

    const { query: settingsQuery, mutation: settingsMutation } = useUserSettings(isLoggedIn);
    const { query: localesQuery, mutation: localesMutation } = useContentLocales(isLoggedIn);

    const [settings, setSettings] = useState<UserSettings>(() => readLocal());
    const [needsReload, setNeedsReload] = useState(false);

    const hydratedFromServer = useRef(false);
    const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Hidrata a partir do api uma vez quando o usuário logado recebe os dados.
    useEffect(() => {
        if (isLoggedIn && settingsQuery.data && !hydratedFromServer.current) {
            hydratedFromServer.current = true;
            setSettings(settingsQuery.data);
            writeLocal(settingsQuery.data);
        }
    }, [isLoggedIn, settingsQuery.data]);

    const fireToast = useCallback(
        (title: string) => {
            toast({ tone: 'accent', title, duration: TOAST_DURATION_MS });
        },
        [toast],
    );

    const scheduleSync = useCallback(
        (next: UserSettings) => {
            if (!isLoggedIn) {
                return;
            }

            if (syncTimer.current) {
                clearTimeout(syncTimer.current);
            }

            syncTimer.current = setTimeout(() => {
                settingsMutation.mutate(next);
            }, SYNC_DEBOUNCE_MS);
        },
        [isLoggedIn, settingsMutation],
    );

    const updateGroup = useCallback(
        <G extends keyof UserSettings>(group: G, patch: Partial<UserSettings[G]>, toastTitle: string) => {
            setSettings(prev => {
                const next: UserSettings = { ...prev, [group]: { ...prev[group], ...patch } };

                writeLocal(next);
                scheduleSync(next);

                return next;
            });

            fireToast(toastTitle);
        },
        [fireToast, scheduleSync],
    );

    useEffect(
        () => () => {
            if (syncTimer.current) {
                clearTimeout(syncTimer.current);
            }
        },
        [],
    );

    // Aplica "reduzir movimento" no <html> sempre que mudar (inclui hidratação do
    // servidor). Sem cleanup de propósito: a classe deve persistir ao sair da tela.
    useEffect(() => {
        applyReduceMotion(settings.accessibility.reduceMotion);
    }, [settings.accessibility.reduceMotion]);

    // Idioma da interface — client-only (i18n + localStorage), exige reload.
    const interfaceLang = i18n.language;

    const changeInterfaceLang = useCallback(
        (lang: string, toastTitle: string) => {
            void i18n.changeLanguage(lang);
            setNeedsReload(true);
            fireToast(toastTitle);
        },
        [i18n, fireToast],
    );

    // Idiomas de leitura — persistidos em contentLocales (recarrega ao confirmar quando logado).
    const readingLangs = useMemo<string[]>(() => localesQuery.data?.contentLocales ?? ['pt-BR'], [localesQuery.data]);

    const setReadingLangs = useCallback(
        (next: string[], toastTitle: string) => {
            const safe = next.length > 0 ? next : ['pt-BR'];

            fireToast(toastTitle);

            if (isLoggedIn) {
                localesMutation.mutate({ contentLocales: safe });
            }
        },
        [isLoggedIn, localesMutation, fireToast],
    );

    return {
        settings,
        updateGroup,
        isLoggedIn,
        needsReload,
        reload: () => window.location.reload(),
        interfaceLang,
        changeInterfaceLang,
        readingLangs,
        setReadingLangs,
    };
}

export type SettingsState = ReturnType<typeof useSettingsState>;

export default useSettingsState;
