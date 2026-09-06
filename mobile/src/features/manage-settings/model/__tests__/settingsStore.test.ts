import * as SecureStore from 'expo-secure-store';
import AxiosMockAdapter from 'axios-mock-adapter';

import { DEFAULT_USER_SETTINGS } from '@/entities/user-setting';
import { api } from '@/shared/api';
import i18n, { DEFAULT_LANGUAGE } from '@/shared/i18n';

import { resetSettingsRuntimeForTests, useSettingsStore } from '../settingsStore';

const secureStore = jest.mocked(SecureStore);
const apiMock = new AxiosMockAdapter(api);
let values = new Map<string, string>();

const resetStore = () => {
    resetSettingsRuntimeForTests();
    useSettingsStore.setState({
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
    });
};

describe('MOB-FEAT-001 settings store', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        values = new Map();
        apiMock.reset();
        resetStore();
        secureStore.getItemAsync.mockImplementation(async key => values.get(key) ?? null);
        secureStore.setItemAsync.mockImplementation(async (key, value) => {
            values.set(key, value);
        });
        secureStore.deleteItemAsync.mockImplementation(async key => {
            values.delete(key);
        });
    });

    afterEach(async () => {
        jest.useRealTimers();
        await i18n.changeLanguage(DEFAULT_LANGUAGE);
    });
    afterAll(() => apiMock.restore());

    it('migra tema e idioma legados somente depois de gravar o envelope', async () => {
        values.set('mr_theme_override', 'dark');
        values.set('mr_language', 'es-ES');

        await useSettingsStore.getState().hydrate();

        expect(useSettingsStore.getState()).toMatchObject({ themeOverride: 'dark', language: 'es-ES', isHydrated: true });
        expect(JSON.parse(values.get('mr_settings_guest_v1') ?? '{}')).toMatchObject({
            version: 2,
            language: 'es-ES',
            revision: 1,
            dirtyPaths: ['appearance.theme'],
        });
        expect(values.has('mr_theme_override')).toBe(false);
        expect(values.has('mr_language')).toBe(false);
    });

    it('migra um envelope antigo preservando campos válidos e normalizando sua versão', async () => {
        values.set(
            'mr_settings_guest_v1',
            JSON.stringify({
                version: 0,
                language: 'en-US',
                guestSettings: {
                    ...DEFAULT_USER_SETTINGS,
                    appearance: { ...DEFAULT_USER_SETTINGS.appearance, theme: 'DARK' },
                },
            }),
        );

        await useSettingsStore.getState().hydrate();

        expect(useSettingsStore.getState()).toMatchObject({ language: 'en-US', themeOverride: 'dark' });
        expect(JSON.parse(values.get('mr_settings_guest_v1') ?? '{}')).toMatchObject({
            version: 2,
            language: 'en-US',
            deviceSettings: { appearance: { theme: 'DARK' } },
            dirtyPaths: ['appearance.theme'],
        });
    });

    it('conclui hidratação com defaults e diagnóstico quando storage falha', async () => {
        secureStore.getItemAsync.mockRejectedValue(new Error('storage unavailable'));

        await useSettingsStore.getState().hydrate();

        expect(useSettingsStore.getState()).toMatchObject({ isHydrated: true, themeOverride: null, language: DEFAULT_LANGUAGE });
        expect(useSettingsStore.getState().localError).toContain('storage unavailable');
    });

    it('conclui hidratação por timeout e ignora conclusão tardia', async () => {
        let releaseStorage!: (value: string | null) => void;
        secureStore.getItemAsync.mockImplementation(
            () =>
                new Promise(resolve => {
                    releaseStorage = resolve;
                }),
        );

        const hydration = useSettingsStore.getState().hydrate();
        jest.advanceTimersByTime(1500);
        await hydration;

        expect(useSettingsStore.getState()).toMatchObject({ isHydrated: true, themeOverride: null });
        releaseStorage('dark');
        await Promise.resolve();
        expect(useSettingsStore.getState().themeOverride).toBeNull();
    });

    it('aplica e persiste edição guest sem acessar endpoints autenticados', async () => {
        await useSettingsStore.getState().hydrate();
        await useSettingsStore.getState().setThemeOverride('light');

        expect(useSettingsStore.getState()).toMatchObject({ themeOverride: 'light', syncStatus: 'local' });
        expect(apiMock.history.get).toHaveLength(0);
        expect(apiMock.history.patch).toHaveLength(0);
        expect(JSON.parse(values.get('mr_settings_guest_v1') ?? '{}')).toMatchObject({
            deviceSettings: { appearance: { theme: 'LIGHT' } },
            revision: 1,
            dirtyPaths: ['appearance.theme'],
        });
    });

    it('troca o idioma da interface sem remontagem e o recupera em nova hidratação', async () => {
        await useSettingsStore.getState().hydrate();

        await useSettingsStore.getState().setLanguage('en-US');

        expect(useSettingsStore.getState().language).toBe('en-US');
        expect(i18n.language).toBe('en-US');
        expect(JSON.parse(values.get('mr_settings_guest_v1') ?? '{}').language).toBe('en-US');

        await i18n.changeLanguage(DEFAULT_LANGUAGE);
        resetStore();
        await useSettingsStore.getState().hydrate();
        expect(useSettingsStore.getState().language).toBe('en-US');
        expect(i18n.language).toBe('en-US');
    });

    it('normaliza idioma persistido não suportado para pt-BR durante a hidratação', async () => {
        values.set('mr_settings_guest_v1', JSON.stringify({ version: 1, language: 'fr-FR', guestSettings: DEFAULT_USER_SETTINGS }));

        await useSettingsStore.getState().hydrate();

        expect(useSettingsStore.getState().language).toBe(DEFAULT_LANGUAGE);
    });

    it('mescla e promove somente a preferência local alterada ao ativar a conta', async () => {
        await useSettingsStore.getState().hydrate();
        await useSettingsStore.getState().setThemeOverride('light');
        apiMock
            .onGet('/users/me/settings')
            .reply(200, { data: { ...DEFAULT_USER_SETTINGS, appearance: { ...DEFAULT_USER_SETTINGS.appearance, theme: 'DARK' } } });
        apiMock.onPatch('/users/me/settings').reply(config => [200, { data: JSON.parse(config.data) }]);

        await useSettingsStore.getState().activateAccount(1);

        expect(useSettingsStore.getState()).toMatchObject({ themeOverride: 'light', syncStatus: 'synced', activeIdentityEpoch: 1, dirtyPaths: [] });
        expect(useSettingsStore.getState().guestSettings.appearance.theme).toBe('LIGHT');
        expect(apiMock.history.patch).toHaveLength(1);
        expect(JSON.parse(apiMock.history.patch[0].data)).toMatchObject({ appearance: { theme: 'LIGHT' } });
    });

    it('não envia defaults locais nem idioma da interface quando não há edição', async () => {
        await useSettingsStore.getState().hydrate();
        await useSettingsStore.getState().setLanguage('en-US');
        apiMock.onGet('/users/me/settings').reply(200, {
            data: { ...DEFAULT_USER_SETTINGS, appearance: { ...DEFAULT_USER_SETTINGS.appearance, theme: 'DARK', density: 'COMPACT' } },
        });

        await useSettingsStore.getState().activateAccount(101);

        expect(apiMock.history.patch).toHaveLength(0);
        expect(useSettingsStore.getState()).toMatchObject({ themeOverride: 'dark', language: 'en-US', syncStatus: 'synced' });
    });

    it('faz debounce e envia somente o objeto integral mais recente', async () => {
        await useSettingsStore.getState().hydrate();
        apiMock.onGet('/users/me/settings').reply(200, { data: DEFAULT_USER_SETTINGS });
        apiMock.onPatch('/users/me/settings').reply(config => [200, { data: JSON.parse(config.data) }]);
        await useSettingsStore.getState().activateAccount(2);

        await useSettingsStore.getState().setThemeOverride('light');
        await useSettingsStore.getState().setThemeOverride('dark');
        jest.advanceTimersByTime(399);
        expect(apiMock.history.patch).toHaveLength(0);
        jest.advanceTimersByTime(1);
        await Promise.resolve();
        await useSettingsStore.getState().flush();

        expect(apiMock.history.patch).toHaveLength(1);
        const payload = JSON.parse(apiMock.history.patch[0].data);
        expect(Object.keys(payload).sort()).toEqual(['accessibility', 'appearance', 'locale', 'reader']);
        expect(payload.appearance.theme).toBe('DARK');
        expect(payload.language).toBeUndefined();
        expect(useSettingsStore.getState()).toMatchObject({ pendingVersion: null, syncStatus: 'synced' });
    });

    it('serializa persistência local e mantém a revisão mais nova quando escritas terminariam fora de ordem', async () => {
        await useSettingsStore.getState().hydrate();
        const writes: { value: string; release: () => void }[] = [];
        secureStore.setItemAsync.mockImplementation(
            (_key, value) =>
                new Promise<void>(resolve => {
                    writes.push({ value, release: resolve });
                }),
        );

        const first = useSettingsStore.getState().setThemeOverride('light');
        await Promise.resolve();
        const second = useSettingsStore.getState().setThemeOverride('dark');
        await Promise.resolve();

        expect(writes).toHaveLength(1);
        writes[0].release();
        await first;
        await Promise.resolve();
        expect(writes).toHaveLength(2);
        writes[1].release();
        await second;

        const persisted = JSON.parse(writes[1].value);
        expect(persisted).toMatchObject({ revision: 2, deviceSettings: { appearance: { theme: 'DARK' } } });
    });

    it('não envia PATCH após falha de hidratação remota até recuperar o baseline da conta', async () => {
        await useSettingsStore.getState().hydrate();
        apiMock
            .onGet('/users/me/settings')
            .replyOnce(500)
            .onGet('/users/me/settings')
            .replyOnce(200, { data: { ...DEFAULT_USER_SETTINGS, appearance: { ...DEFAULT_USER_SETTINGS.appearance, density: 'COMPACT' } } });
        apiMock.onPatch('/users/me/settings').reply(config => [200, { data: JSON.parse(config.data) }]);

        await useSettingsStore.getState().activateAccount(102);
        await useSettingsStore.getState().setThemeOverride('light');
        jest.advanceTimersByTime(400);
        await useSettingsStore.getState().flush();

        expect(useSettingsStore.getState()).toMatchObject({ hasRemoteBaseline: false, syncStatus: 'error' });
        expect(apiMock.history.patch).toHaveLength(0);

        await useSettingsStore.getState().retry();

        expect(apiMock.history.patch).toHaveLength(1);
        expect(JSON.parse(apiMock.history.patch[0].data)).toMatchObject({ appearance: { theme: 'LIGHT', density: 'COMPACT' } });
        expect(useSettingsStore.getState()).toMatchObject({ hasRemoteBaseline: true, syncStatus: 'synced' });
    });

    it('preserva pending em falha, permite retry e volta ao guest no logout', async () => {
        await useSettingsStore.getState().hydrate();
        await useSettingsStore.getState().setThemeOverride('light');
        apiMock.onGet('/users/me/settings').reply(200, {
            data: { ...DEFAULT_USER_SETTINGS, appearance: { ...DEFAULT_USER_SETTINGS.appearance, theme: 'LIGHT' } },
        });
        apiMock
            .onPatch('/users/me/settings')
            .replyOnce(500)
            .onPatch('/users/me/settings')
            .reply(config => [200, { data: JSON.parse(config.data) }]);
        await useSettingsStore.getState().activateAccount(3);
        await useSettingsStore.getState().setThemeOverride('dark');

        await useSettingsStore.getState().flush();
        expect(useSettingsStore.getState()).toMatchObject({ syncStatus: 'error' });
        expect(useSettingsStore.getState().pendingVersion).not.toBeNull();

        await useSettingsStore.getState().retry();
        expect(useSettingsStore.getState()).toMatchObject({ syncStatus: 'synced', pendingVersion: null });

        useSettingsStore.getState().deactivateAccount();
        expect(useSettingsStore.getState()).toMatchObject({ activeIdentityEpoch: null, themeOverride: 'dark', syncStatus: 'local' });
    });

    it('sincroniza dateFormat e timezone localmente e mantém retry após falha autenticada', async () => {
        await useSettingsStore.getState().hydrate();
        apiMock.onGet('/users/me/settings').reply(200, { data: DEFAULT_USER_SETTINGS });
        apiMock
            .onPatch('/users/me/settings')
            .replyOnce(500)
            .onPatch('/users/me/settings')
            .reply(config => [200, { data: JSON.parse(config.data) }]);
        await useSettingsStore.getState().activateAccount(50);

        await useSettingsStore.getState().updateSettings(current => ({ ...current, locale: { dateFormat: 'MON_D', timezone: 'Asia/Tokyo' } }), 'locale');

        expect(useSettingsStore.getState()).toMatchObject({
            pendingGroup: 'locale',
            settings: { locale: { dateFormat: 'MON_D', timezone: 'Asia/Tokyo' } },
        });
        await useSettingsStore.getState().flush();
        expect(useSettingsStore.getState()).toMatchObject({ syncStatus: 'error' });
        expect(useSettingsStore.getState().settings.locale).toEqual({ dateFormat: 'MON_D', timezone: 'Asia/Tokyo' });

        await useSettingsStore.getState().retry();
        expect(JSON.parse(apiMock.history.patch[1].data).locale).toEqual({ dateFormat: 'MON_D', timezone: 'Asia/Tokyo' });
        expect(useSettingsStore.getState()).toMatchObject({ syncStatus: 'synced', pendingVersion: null });
    });

    it('ignora hidratação tardia de uma identidade anterior', async () => {
        await useSettingsStore.getState().hydrate();
        let releaseFirst!: () => void;
        let markFirstStarted!: () => void;
        const firstStarted = new Promise<void>(resolve => {
            markFirstStarted = resolve;
        });
        apiMock
            .onGet('/users/me/settings')
            .replyOnce(async () => {
                markFirstStarted();
                await new Promise<void>(resolve => {
                    releaseFirst = resolve;
                });
                return [200, { data: { ...DEFAULT_USER_SETTINGS, appearance: { ...DEFAULT_USER_SETTINGS.appearance, theme: 'DARK' } } }];
            })
            .onGet('/users/me/settings')
            .replyOnce(200, { data: { ...DEFAULT_USER_SETTINGS, appearance: { ...DEFAULT_USER_SETTINGS.appearance, theme: 'LIGHT' } } });

        const first = useSettingsStore.getState().activateAccount(10);
        await firstStarted;
        await useSettingsStore.getState().activateAccount(11);
        releaseFirst();
        await first;

        expect(useSettingsStore.getState()).toMatchObject({ activeIdentityEpoch: 11, themeOverride: 'light', syncStatus: 'synced' });
    });

    it('cancela a hidratação HTTP da identidade anterior ao trocar de conta', async () => {
        await useSettingsStore.getState().hydrate();
        let firstSignal: { readonly aborted: boolean } | undefined;
        let releaseFirst!: () => void;
        let markFirstStarted!: () => void;
        const firstStarted = new Promise<void>(resolve => {
            markFirstStarted = resolve;
        });
        apiMock
            .onGet('/users/me/settings')
            .replyOnce(async config => {
                firstSignal = config.signal;
                markFirstStarted();
                await new Promise<void>(resolve => {
                    releaseFirst = resolve;
                });
                return [200, { data: DEFAULT_USER_SETTINGS }];
            })
            .onGet('/users/me/settings')
            .replyOnce(200, { data: DEFAULT_USER_SETTINGS });

        const first = useSettingsStore.getState().activateAccount(20);
        await firstStarted;
        await useSettingsStore.getState().activateAccount(21);

        expect(firstSignal?.aborted).toBe(true);
        releaseFirst();
        await first;
    });

    it('não deixa a resposta de um PATCH antigo sobrescrever uma edição mais nova', async () => {
        await useSettingsStore.getState().hydrate();
        apiMock.onGet('/users/me/settings').reply(200, { data: DEFAULT_USER_SETTINGS });
        let releaseFirst!: () => void;
        let markFirstStarted!: () => void;
        const firstStarted = new Promise<void>(resolve => {
            markFirstStarted = resolve;
        });
        apiMock
            .onPatch('/users/me/settings')
            .replyOnce(async config => {
                markFirstStarted();
                await new Promise<void>(resolve => {
                    releaseFirst = resolve;
                });
                return [200, { data: JSON.parse(config.data) }];
            })
            .onPatch('/users/me/settings')
            .reply(config => [200, { data: JSON.parse(config.data) }]);
        await useSettingsStore.getState().activateAccount(30);

        await useSettingsStore.getState().setThemeOverride('light');
        const firstFlush = useSettingsStore.getState().flush();
        await firstStarted;
        await useSettingsStore.getState().setThemeOverride('dark');
        releaseFirst();
        await firstFlush;
        jest.advanceTimersByTime(400);
        await useSettingsStore.getState().flush();

        expect(apiMock.history.patch).toHaveLength(2);
        expect(JSON.parse(apiMock.history.patch[0].data).appearance.theme).toBe('LIGHT');
        expect(JSON.parse(apiMock.history.patch[1].data).appearance.theme).toBe('DARK');
        expect(useSettingsStore.getState()).toMatchObject({ themeOverride: 'dark', pendingVersion: null, syncStatus: 'synced' });
    });

    it('cancela PATCH pendente ao sair da conta sem alterar o perfil guest', async () => {
        await useSettingsStore.getState().hydrate();
        await useSettingsStore.getState().setThemeOverride('light');
        apiMock.onGet('/users/me/settings').reply(200, {
            data: { ...DEFAULT_USER_SETTINGS, appearance: { ...DEFAULT_USER_SETTINGS.appearance, theme: 'LIGHT' } },
        });
        let patchSignal: { readonly aborted: boolean } | undefined;
        let releasePatch!: () => void;
        let markPatchStarted!: () => void;
        const patchStarted = new Promise<void>(resolve => {
            markPatchStarted = resolve;
        });
        apiMock.onPatch('/users/me/settings').reply(async config => {
            patchSignal = config.signal;
            markPatchStarted();
            await new Promise<void>(resolve => {
                releasePatch = resolve;
            });
            return [200, { data: JSON.parse(config.data) }];
        });
        await useSettingsStore.getState().activateAccount(40);
        await useSettingsStore.getState().setThemeOverride('dark');
        const flush = useSettingsStore.getState().flush();
        await patchStarted;

        useSettingsStore.getState().deactivateAccount();
        expect(patchSignal?.aborted).toBe(true);
        expect(useSettingsStore.getState()).toMatchObject({ activeIdentityEpoch: null, themeOverride: 'dark', syncStatus: 'local' });

        releasePatch();
        await flush;
        expect(useSettingsStore.getState()).toMatchObject({ activeIdentityEpoch: null, themeOverride: 'dark', syncStatus: 'local' });
    });
});
