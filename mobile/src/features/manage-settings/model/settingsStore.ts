import { create } from 'zustand';

import {
    DEFAULT_USER_SETTINGS,
    getMySettings,
    normalizeUserSettings,
    SETTINGS_ENVELOPE_VERSION,
    type SyncStatus,
    themePreferenceToColorScheme,
    type UserSettings,
} from '@/src/entities/user-setting';
import i18n, { DEFAULT_LANGUAGE, isSupportedLanguage, type SupportedLanguage } from '@/src/shared/i18n';
import { readJson, secureKeyValueStorage, writeJson } from '@/src/shared/storage';
import type { ColorScheme } from '@/src/shared/theme';

import { updateMySettings } from '../api/manageSettingsApi';
import { applyUserSettingsPaths, diffUserSettings, isUserSettingsPath, mergeUserSettingsPaths, type UserSettingsPath } from './deviceSettings';

const SETTINGS_KEY = 'mr_settings_guest_v1';
const LEGACY_THEME_KEY = 'mr_theme_override';
const LEGACY_LANGUAGE_KEY = 'mr_language';
const SYNC_DEBOUNCE_MS = 400;
const STORAGE_TIMEOUT_MS = 1500;

interface SettingsEnvelopeV2 {
    version: 2;
    deviceSettings: UserSettings;
    language: SupportedLanguage;
    revision: number;
    dirtyPaths: UserSettingsPath[];
}

interface StoredSettingsEnvelope {
    version?: number;
    deviceSettings?: unknown;
    guestSettings?: unknown;
    language?: unknown;
    revision?: unknown;
    dirtyPaths?: unknown;
}

interface SettingsState {
    settings: UserSettings;
    guestSettings: UserSettings;
    themeOverride: ColorScheme | null;
    language: SupportedLanguage;
    localRevision: number;
    dirtyPaths: UserSettingsPath[];
    isHydrated: boolean;
    activeIdentityEpoch: number | null;
    hasRemoteBaseline: boolean;
    syncStatus: SyncStatus;
    pendingVersion: number | null;
    pendingGroup: SettingsSyncGroup | null;
    localError: string | null;
    syncError: string | null;
}

interface SettingsActions {
    hydrate: () => Promise<void>;
    retryLocalHydration: () => Promise<void>;
    activateAccount: (identityEpoch: number) => Promise<void>;
    deactivateAccount: () => void;
    updateSettings: (updater: (current: UserSettings) => UserSettings, group?: SettingsSyncGroup) => Promise<void>;
    setThemeOverride: (scheme: ColorScheme | null) => Promise<void>;
    setLanguage: (language: SupportedLanguage) => Promise<void>;
    flush: () => Promise<void>;
    retry: () => Promise<void>;
}

export type SettingsSyncGroup = 'appearance' | 'locale' | 'reader';
export type SettingsSyncProjectionStatus = 'local' | 'pending' | 'syncing' | 'synced' | 'error';

export interface SettingsSyncProjection {
    status: SettingsSyncProjectionStatus;
    retry: () => Promise<void>;
}

interface PendingSnapshot {
    version: number;
    revision: number;
    paths: UserSettingsPath[];
    settings: UserSettings;
}

let transitionToken = 0;
let editVersion = 0;
let pendingSnapshot: PendingSnapshot | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let flushPromise: Promise<void> | null = null;
let persistenceTail: Promise<void> = Promise.resolve();
let persistenceVersion = 0;
const activeRequests = new Set<AbortController>();

const message = (error: unknown): string => (error instanceof Error ? error.message : 'Unknown settings error');

const withTimeout = async <T>(operation: Promise<T>, timeoutMs: number): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Settings storage timeout')), timeoutMs);
        operation.then(
            value => {
                clearTimeout(timeout);
                resolve(value);
            },
            error => {
                clearTimeout(timeout);
                reject(error);
            },
        );
    });

const envelope = (deviceSettings: UserSettings, language: SupportedLanguage, revision: number, dirtyPaths: UserSettingsPath[]): SettingsEnvelopeV2 => ({
    version: SETTINGS_ENVELOPE_VERSION,
    deviceSettings,
    language,
    revision,
    dirtyPaths,
});

async function readLocalEnvelope(): Promise<SettingsEnvelopeV2> {
    const stored = await readJson<StoredSettingsEnvelope>(secureKeyValueStorage, SETTINGS_KEY);

    if (stored && typeof stored.version === 'number' && stored.version > SETTINGS_ENVELOPE_VERSION) {
        throw new Error(`Unsupported settings envelope version: ${stored.version}`);
    }

    const storedSettings = stored?.deviceSettings ?? stored?.guestSettings;
    if (storedSettings !== undefined) {
        const deviceSettings = normalizeUserSettings(storedSettings);
        const migratedFromV1 = stored?.version !== SETTINGS_ENVELOPE_VERSION;
        const dirtyPaths = migratedFromV1
            ? diffUserSettings(DEFAULT_USER_SETTINGS, deviceSettings)
            : Array.isArray(stored.dirtyPaths)
              ? stored.dirtyPaths.filter(isUserSettingsPath)
              : [];
        const migrated = envelope(
            deviceSettings,
            typeof stored?.language === 'string' && isSupportedLanguage(stored.language) ? stored.language : DEFAULT_LANGUAGE,
            typeof stored?.revision === 'number' && Number.isInteger(stored.revision) && stored.revision >= 0 ? stored.revision : dirtyPaths.length > 0 ? 1 : 0,
            dirtyPaths,
        );
        await writeJson(secureKeyValueStorage, SETTINGS_KEY, migrated);
        return migrated;
    }

    const [legacyTheme, legacyLanguage] = await Promise.all([secureKeyValueStorage.get(LEGACY_THEME_KEY), secureKeyValueStorage.get(LEGACY_LANGUAGE_KEY)]);
    const deviceSettings = normalizeUserSettings({
        appearance: {
            theme: legacyTheme === 'dark' ? 'DARK' : legacyTheme === 'light' ? 'LIGHT' : 'SYSTEM',
        },
    });
    const dirtyPaths = diffUserSettings(DEFAULT_USER_SETTINGS, deviceSettings);
    const migrated = envelope(
        deviceSettings,
        isSupportedLanguage(legacyLanguage) ? legacyLanguage : DEFAULT_LANGUAGE,
        dirtyPaths.length > 0 || isSupportedLanguage(legacyLanguage) ? 1 : 0,
        dirtyPaths,
    );

    await writeJson(secureKeyValueStorage, SETTINGS_KEY, migrated);
    await Promise.all([secureKeyValueStorage.remove(LEGACY_THEME_KEY), secureKeyValueStorage.remove(LEGACY_LANGUAGE_KEY)]);
    return migrated;
}

const clearSyncTimer = () => {
    if (syncTimer !== null) clearTimeout(syncTimer);
    syncTimer = null;
};

const cancelActiveRequests = () => {
    activeRequests.forEach(controller => controller.abort());
    activeRequests.clear();
};

const requestController = (): AbortController => {
    const controller = new AbortController();
    activeRequests.add(controller);
    return controller;
};

export const useSettingsStore = create<SettingsState & SettingsActions>((set, get) => {
    const persistDevice = async () => {
        const value = envelope(get().guestSettings, get().language, get().localRevision, get().dirtyPaths);
        const version = ++persistenceVersion;
        const operation = persistenceTail.then(() => writeJson(secureKeyValueStorage, SETTINGS_KEY, value));
        persistenceTail = operation.catch(() => undefined);
        try {
            await operation;
            if (version === persistenceVersion) set({ localError: null });
        } catch (error) {
            if (version === persistenceVersion) set({ localError: message(error) });
        }
    };

    const scheduleSync = () => {
        clearSyncTimer();
        syncTimer = setTimeout(() => {
            syncTimer = null;
            void get().flush();
        }, SYNC_DEBOUNCE_MS);
    };

    const queueSnapshot = (settings: UserSettings, paths: UserSettingsPath[], revision: number, group: SettingsSyncGroup | null) => {
        const version = ++editVersion;
        pendingSnapshot = { version, settings, paths, revision };
        set({ pendingVersion: version, pendingGroup: group, syncStatus: 'local', syncError: null });
        return version;
    };

    return {
        settings: DEFAULT_USER_SETTINGS,
        guestSettings: DEFAULT_USER_SETTINGS,
        themeOverride: null,
        language: DEFAULT_LANGUAGE,
        localRevision: 0,
        dirtyPaths: [],
        isHydrated: false,
        activeIdentityEpoch: null,
        hasRemoteBaseline: false,
        syncStatus: 'local',
        pendingVersion: null,
        pendingGroup: null,
        localError: null,
        syncError: null,

        hydrate: async () => {
            if (get().isHydrated) return;
            const hydrationToken = ++transitionToken;
            try {
                const local = await withTimeout(readLocalEnvelope(), STORAGE_TIMEOUT_MS);
                if (hydrationToken !== transitionToken) return;
                await i18n.changeLanguage(local.language);
                if (hydrationToken !== transitionToken) return;
                set({
                    settings: local.deviceSettings,
                    guestSettings: local.deviceSettings,
                    themeOverride: themePreferenceToColorScheme(local.deviceSettings.appearance.theme),
                    language: local.language,
                    localRevision: local.revision,
                    dirtyPaths: local.dirtyPaths,
                    isHydrated: true,
                    localError: null,
                });
            } catch (error) {
                if (hydrationToken !== transitionToken) return;
                await i18n.changeLanguage(DEFAULT_LANGUAGE);
                if (hydrationToken !== transitionToken) return;
                set({
                    settings: DEFAULT_USER_SETTINGS,
                    guestSettings: DEFAULT_USER_SETTINGS,
                    themeOverride: null,
                    language: DEFAULT_LANGUAGE,
                    localRevision: 0,
                    dirtyPaths: [],
                    isHydrated: true,
                    localError: message(error),
                });
            }
        },

        retryLocalHydration: async () => {
            transitionToken += 1;
            set({ isHydrated: false, localError: null });
            await get().hydrate();
        },

        activateAccount: async identityEpoch => {
            if (get().activeIdentityEpoch === identityEpoch) return;
            const requestToken = ++transitionToken;
            cancelActiveRequests();
            clearSyncTimer();
            pendingSnapshot = null;
            flushPromise = null;
            set({
                settings: get().guestSettings,
                themeOverride: themePreferenceToColorScheme(get().guestSettings.appearance.theme),
                activeIdentityEpoch: identityEpoch,
                hasRemoteBaseline: false,
                pendingVersion: null,
                pendingGroup: null,
                syncStatus: 'syncing',
                syncError: null,
            });

            const controller = requestController();
            try {
                const remote = await getMySettings(controller.signal);
                if (requestToken !== transitionToken || get().activeIdentityEpoch !== identityEpoch) return;
                const paths = get().dirtyPaths;
                const merged = applyUserSettingsPaths(remote, get().guestSettings, paths);
                set({ settings: merged, themeOverride: themePreferenceToColorScheme(merged.appearance.theme), hasRemoteBaseline: true });
                if (paths.length === 0 || diffUserSettings(remote, merged).length === 0) {
                    if (paths.length > 0) {
                        set({ dirtyPaths: [] });
                        await persistDevice();
                    }
                    set({ syncStatus: 'synced', syncError: null });
                    return;
                }
                queueSnapshot(merged, paths, get().localRevision, null);
                await get().flush();
            } catch (error) {
                if (requestToken !== transitionToken || get().activeIdentityEpoch !== identityEpoch) return;
                set({ syncStatus: 'error', syncError: message(error) });
            } finally {
                activeRequests.delete(controller);
            }
        },

        deactivateAccount: () => {
            transitionToken += 1;
            cancelActiveRequests();
            clearSyncTimer();
            pendingSnapshot = null;
            flushPromise = null;
            const deviceSettings = get().guestSettings;
            set({
                settings: deviceSettings,
                themeOverride: themePreferenceToColorScheme(deviceSettings.appearance.theme),
                activeIdentityEpoch: null,
                hasRemoteBaseline: false,
                pendingVersion: null,
                pendingGroup: null,
                syncStatus: 'local',
                syncError: null,
            });
        },

        updateSettings: async (updater, group = 'appearance') => {
            const current = get().settings;
            const next = normalizeUserSettings(updater(current), current);
            const changedPaths = diffUserSettings(current, next);
            if (changedPaths.length === 0) return;

            const deviceSettings = applyUserSettingsPaths(get().guestSettings, next, changedPaths);
            const dirtyPaths = mergeUserSettingsPaths(get().dirtyPaths, changedPaths);
            const localRevision = get().localRevision + 1;
            set({
                settings: next,
                guestSettings: deviceSettings,
                themeOverride: themePreferenceToColorScheme(next.appearance.theme),
                localRevision,
                dirtyPaths,
                syncStatus: get().activeIdentityEpoch === null ? 'local' : get().syncStatus,
                syncError: null,
            });
            await persistDevice();

            if (get().activeIdentityEpoch !== null && get().hasRemoteBaseline) {
                queueSnapshot(next, dirtyPaths, localRevision, group);
                scheduleSync();
            }
        },

        setThemeOverride: async scheme => {
            const theme = scheme === 'dark' ? 'DARK' : scheme === 'light' ? 'LIGHT' : 'SYSTEM';
            await get().updateSettings(current => ({ ...current, appearance: { ...current.appearance, theme } }));
        },

        setLanguage: async language => {
            if (!isSupportedLanguage(language) || language === get().language) return;
            await i18n.changeLanguage(language);
            set({ language, localRevision: get().localRevision + 1 });
            await persistDevice();
        },

        flush: async () => {
            if (flushPromise) return flushPromise;
            const snapshot = pendingSnapshot;
            const identityEpoch = get().activeIdentityEpoch;
            if (!snapshot || identityEpoch === null || !get().hasRemoteBaseline) return;

            clearSyncTimer();
            const requestToken = transitionToken;
            const controller = requestController();
            set({ syncStatus: 'syncing' });
            const operation = updateMySettings(snapshot.settings, controller.signal)
                .then(async remote => {
                    if (requestToken !== transitionToken || get().activeIdentityEpoch !== identityEpoch || pendingSnapshot?.version !== snapshot.version)
                        return;
                    pendingSnapshot = null;
                    const remainingPaths = get().dirtyPaths.filter(path => !snapshot.paths.includes(path));
                    set({
                        settings: remote,
                        themeOverride: themePreferenceToColorScheme(remote.appearance.theme),
                        dirtyPaths: remainingPaths,
                        pendingVersion: null,
                        pendingGroup: null,
                        syncStatus: 'synced',
                        syncError: null,
                    });
                    await persistDevice();
                })
                .catch(error => {
                    if (requestToken !== transitionToken || get().activeIdentityEpoch !== identityEpoch || pendingSnapshot?.version !== snapshot.version)
                        return;
                    set({ syncStatus: 'error', syncError: message(error) });
                })
                .finally(() => {
                    activeRequests.delete(controller);
                    if (flushPromise === operation) flushPromise = null;
                    if (requestToken === transitionToken && get().activeIdentityEpoch === identityEpoch && pendingSnapshot?.version !== snapshot.version) {
                        scheduleSync();
                    }
                });
            flushPromise = operation;
            return flushPromise;
        },

        retry: async () => {
            if (pendingSnapshot) return get().flush();
            const identityEpoch = get().activeIdentityEpoch;
            if (identityEpoch === null) return;
            set({ activeIdentityEpoch: null });
            await get().activateAccount(identityEpoch);
        },
    };
});

export function resetSettingsRuntimeForTests(): void {
    transitionToken += 1;
    cancelActiveRequests();
    editVersion = 0;
    pendingSnapshot = null;
    clearSyncTimer();
    flushPromise = null;
    persistenceTail = Promise.resolve();
    persistenceVersion = 0;
}

export function getSettingsSyncProjection(group: SettingsSyncGroup): SettingsSyncProjection {
    const state = useSettingsStore.getState();
    if (state.activeIdentityEpoch === null) return { status: 'local', retry: state.retry };
    const belongsToGroup = state.pendingGroup === null || state.pendingGroup === group;
    if (state.syncStatus === 'error' && belongsToGroup) return { status: 'error', retry: state.retry };
    if (state.syncStatus === 'syncing' && belongsToGroup) return { status: 'syncing', retry: state.retry };
    if (state.pendingVersion !== null && state.pendingGroup === group) return { status: 'pending', retry: state.retry };
    return { status: 'synced', retry: state.retry };
}
