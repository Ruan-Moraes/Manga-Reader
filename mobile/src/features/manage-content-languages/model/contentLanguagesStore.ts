import { create } from 'zustand';

import { type ContentLanguageChain, deriveGuestContentLanguages, normalizeContentLanguages } from '@/src/entities/content-language-preference';
import type { SupportedLanguage } from '@/src/shared/i18n';

export type ContentLanguagesHydrationStatus = 'guest' | 'loading' | 'ready' | 'error';
export type ContentLanguagesSyncStatus = 'idle' | 'syncing' | 'error';
export type ContentLanguagesStatusProjection = 'local' | 'pending' | 'syncing' | 'synced' | 'error';

interface ContentLanguagesState {
    identityEpoch: number | null;
    interfaceLanguage: SupportedLanguage;
    effective: ContentLanguageChain;
    confirmed: ContentLanguageChain | null;
    pending: ContentLanguageChain | null;
    hydrationStatus: ContentLanguagesHydrationStatus;
    syncStatus: ContentLanguagesSyncStatus;
    readError: string | null;
    writeError: string | null;
    invalidationError: string | null;
    consumerRetrying: boolean;
}

interface ContentLanguagesActions {
    beginGuest: (language: SupportedLanguage, fallback?: ContentLanguageChain) => void;
    beginAccount: (identityEpoch: number, language: SupportedLanguage, fallback?: ContentLanguageChain) => void;
    updateInterfaceLanguage: (language: SupportedLanguage, fallback?: ContentLanguageChain) => void;
    hydrate: (identityEpoch: number, contentLocales: unknown) => void;
    failHydration: (identityEpoch: number, error: string) => void;
    beginSync: (identityEpoch: number, contentLocales: ContentLanguageChain) => void;
    confirm: (identityEpoch: number, contentLocales: unknown) => void;
    failSync: (identityEpoch: number, error: string) => void;
    beginConsumerRetry: (identityEpoch: number) => void;
    completeConsumerInvalidation: (identityEpoch: number, error: string | null) => void;
}

export const useContentLanguagesStore = create<ContentLanguagesState & ContentLanguagesActions>((set, get) => ({
    identityEpoch: null,
    interfaceLanguage: 'pt-BR',
    effective: ['pt-BR'],
    confirmed: null,
    pending: null,
    hydrationStatus: 'guest',
    syncStatus: 'idle',
    readError: null,
    writeError: null,
    invalidationError: null,
    consumerRetrying: false,

    beginGuest: (interfaceLanguage, fallback = deriveGuestContentLanguages(interfaceLanguage)) =>
        set({
            identityEpoch: null,
            interfaceLanguage,
            effective: fallback,
            confirmed: null,
            pending: null,
            hydrationStatus: 'guest',
            syncStatus: 'idle',
            readError: null,
            writeError: null,
            invalidationError: null,
            consumerRetrying: false,
        }),
    beginAccount: (identityEpoch, interfaceLanguage, fallback = deriveGuestContentLanguages(interfaceLanguage)) =>
        set({
            identityEpoch,
            interfaceLanguage,
            effective: fallback,
            confirmed: null,
            pending: null,
            hydrationStatus: 'loading',
            syncStatus: 'idle',
            readError: null,
            writeError: null,
            invalidationError: null,
            consumerRetrying: false,
        }),
    updateInterfaceLanguage: (interfaceLanguage, fallback = deriveGuestContentLanguages(interfaceLanguage)) =>
        set(state => ({
            interfaceLanguage,
            effective: state.identityEpoch === null || state.hydrationStatus !== 'ready' ? fallback : state.effective,
        })),
    hydrate: (identityEpoch, contentLocales) => {
        if (get().identityEpoch !== identityEpoch) return;
        const confirmed = normalizeContentLanguages(contentLocales);
        set({ confirmed, effective: confirmed, pending: null, hydrationStatus: 'ready', syncStatus: 'idle', readError: null });
    },
    failHydration: (identityEpoch, readError) => {
        const state = get();
        if (state.identityEpoch !== identityEpoch) return;
        set({
            confirmed: null,
            pending: null,
            effective: deriveGuestContentLanguages(state.interfaceLanguage),
            hydrationStatus: 'error',
            syncStatus: 'idle',
            readError,
        });
    },
    beginSync: (identityEpoch, pending) => {
        if (get().identityEpoch !== identityEpoch) return;
        set({ effective: pending, pending, syncStatus: 'syncing', writeError: null, invalidationError: null, consumerRetrying: false });
    },
    confirm: (identityEpoch, contentLocales) => {
        if (get().identityEpoch !== identityEpoch) return;
        const confirmed = normalizeContentLanguages(contentLocales);
        set({ confirmed, effective: confirmed, pending: null, hydrationStatus: 'ready', syncStatus: 'idle', writeError: null });
    },
    failSync: (identityEpoch, writeError) => {
        if (get().identityEpoch !== identityEpoch) return;
        set({ syncStatus: 'error', writeError });
    },
    beginConsumerRetry: identityEpoch => {
        if (get().identityEpoch !== identityEpoch) return;
        set({ consumerRetrying: true });
    },
    completeConsumerInvalidation: (identityEpoch, invalidationError) => {
        if (get().identityEpoch !== identityEpoch) return;
        set({ consumerRetrying: false, invalidationError });
    },
}));

export function getContentLanguagesStatusProjection(): ContentLanguagesStatusProjection {
    const state = useContentLanguagesStore.getState();
    if (state.identityEpoch === null) return 'local';
    if (state.readError || state.writeError || state.invalidationError || state.syncStatus === 'error') return 'error';
    if (state.hydrationStatus === 'loading' || state.syncStatus === 'syncing' || state.consumerRetrying) return 'syncing';
    if (state.pending) return 'pending';
    return 'synced';
}
