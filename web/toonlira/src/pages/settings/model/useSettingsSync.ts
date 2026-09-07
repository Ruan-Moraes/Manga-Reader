import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@features/auth';
import {
    type UserSettings,
    useUserSettings,
    applySystemPreferences,
    readStoredUserSettings,
    writeStoredUserSettings,
    subscribeStoredUserSettings,
} from '@entities/user';

import { useSettingsToast } from './useSettingsToast';

const SYNC_DEBOUNCE_MS = 400;

export type SettingsSyncStatus = 'local' | 'idle' | 'syncing' | 'synced' | 'error';

/**
 * Núcleo das configurações do sistema: salva live em localStorage e sincroniza com a api quando
 * logado (debounced), guardando respostas obsoletas por versão e descarregando mudanças pendentes
 * no unmount. Aplica as preferências globais no `<html>` a cada mudança.
 */
export const useSettingsSync = () => {
    const { isLoggedIn, user } = useAuth();
    const fireToast = useSettingsToast();

    const { query: settingsQuery, mutation: settingsMutation } = useUserSettings(isLoggedIn, user?.id);

    const [settings, setSettings] = useState<UserSettings>(() => readStoredUserSettings());
    const [syncStatus, setSyncStatus] = useState<SettingsSyncStatus>(() => (isLoggedIn ? 'syncing' : 'local'));

    const hydratedFromServer = useRef(false);
    const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSettings = useRef<UserSettings | null>(null);
    const settingsVersion = useRef(0);
    const settingsMutationRef = useRef(settingsMutation);
    const isLoggedInRef = useRef(isLoggedIn);

    useEffect(() => {
        settingsMutationRef.current = settingsMutation;
        isLoggedInRef.current = isLoggedIn;
    }, [isLoggedIn, settingsMutation]);

    useEffect(() => {
        hydratedFromServer.current = false;
        pendingSettings.current = null;
        settingsVersion.current += 1;

        if (syncTimer.current) {
            clearTimeout(syncTimer.current);
            syncTimer.current = null;
        }

        setSyncStatus(isLoggedIn ? 'syncing' : 'local');
    }, [isLoggedIn, user?.id]);

    const commitSettings = useCallback(
        (next: UserSettings, version = settingsVersion.current) => {
            if (!isLoggedIn) {
                setSyncStatus('local');
                return;
            }

            setSyncStatus('syncing');
            pendingSettings.current = next;

            settingsMutation.mutate(next, {
                onSuccess: data => {
                    if (version !== settingsVersion.current) {
                        return;
                    }

                    pendingSettings.current = null;
                    setSyncStatus('synced');
                    setSettings(data);
                    writeStoredUserSettings(data);
                },
                onError: () => {
                    if (version !== settingsVersion.current) {
                        return;
                    }

                    pendingSettings.current = next;
                    setSyncStatus('error');
                },
            });
        },
        [isLoggedIn, settingsMutation],
    );

    // Hidrata a partir do api uma vez por usuário logado quando os dados chegam.
    useEffect(() => {
        if (isLoggedIn && settingsQuery.data && !hydratedFromServer.current) {
            hydratedFromServer.current = true;

            if (!pendingSettings.current) {
                setSettings(settingsQuery.data);
                writeStoredUserSettings(settingsQuery.data);
                setSyncStatus('synced');
            }
        }
    }, [isLoggedIn, settingsQuery.data]);

    useEffect(() => {
        if (isLoggedIn && settingsQuery.isError && !hydratedFromServer.current) {
            setSyncStatus('error');
        }
    }, [isLoggedIn, settingsQuery.isError]);

    const scheduleSync = useCallback(
        (next: UserSettings) => {
            if (!isLoggedIn) {
                return;
            }

            const version = settingsVersion.current + 1;
            settingsVersion.current = version;
            pendingSettings.current = next;
            setSyncStatus('syncing');

            if (syncTimer.current) {
                clearTimeout(syncTimer.current);
            }

            syncTimer.current = setTimeout(() => {
                syncTimer.current = null;
                commitSettings(next, version);
            }, SYNC_DEBOUNCE_MS);
        },
        [commitSettings, isLoggedIn],
    );

    const updateGroup = useCallback(
        <G extends keyof UserSettings>(group: G, patch: Partial<UserSettings[G]>, toastTitle: string) => {
            setSettings(prev => {
                const next: UserSettings = { ...prev, [group]: { ...prev[group], ...patch } };

                writeStoredUserSettings(next);
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
                syncTimer.current = null;
            }

            if (pendingSettings.current && isLoggedInRef.current) {
                settingsMutationRef.current.mutate(pendingSettings.current);
            }
        },
        [],
    );

    const retrySync = useCallback(() => {
        setSyncStatus('syncing');

        if (pendingSettings.current) {
            commitSettings(pendingSettings.current);
            return;
        }

        if (isLoggedIn) {
            void settingsQuery.refetch();
        }
    }, [commitSettings, isLoggedIn, settingsQuery]);

    // Aplica preferências globais no <html> sempre que mudar (inclui hidratação
    // do servidor). Sem cleanup: elas devem persistir ao sair da tela.
    useEffect(() => {
        applySystemPreferences(settings);
    }, [settings]);

    useEffect(() => subscribeStoredUserSettings(setSettings), []);

    return { settings, updateGroup, isLoggedIn, syncStatus, retrySync };
};

export default useSettingsSync;
