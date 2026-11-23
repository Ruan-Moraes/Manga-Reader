import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import type { RemoteGatewayTransport } from '@/shared/remote-gateway';
import { registerLocalDataParticipant } from '@/shared/storage';

const INSTALLATION_KEY = 'mr_remote_gateway_installation_v1';

const installationResponseSchema = z
    .object({ contractVersion: z.literal('1.0'), installationRef: z.uuid(), credential: z.string().min(32).max(512), createdAt: z.iso.datetime() })
    .strict();

const sessionResponseSchema = z.object({ contractVersion: z.literal('1.0'), accessToken: z.string().min(32).max(4096), expiresAt: z.iso.datetime() }).strict();
const storedInstallationSchema = z.object({ gatewayKey: z.string(), installationRef: z.uuid(), credential: z.string().min(32).max(512) }).strict();

export interface AnonymousGatewaySession {
    accessToken: string;
    expiresAt: number;
}

export interface RemoteProcessingIdentity {
    getSession(gatewayKey: string, transport: RemoteGatewayTransport, signal?: AbortSignal): Promise<AnonymousGatewaySession>;
    measureBytes(): Promise<number>;
    clear(): Promise<void>;
}

export function createRemoteProcessingIdentity(
    storage: Pick<typeof SecureStore, 'getItemAsync' | 'setItemAsync' | 'deleteItemAsync'> = SecureStore,
): RemoteProcessingIdentity {
    let session: { gatewayKey: string; value: AnonymousGatewaySession } | null = null;
    let generation = 0;
    const pendingSessions = new Map<string, { generation: number; controller: AbortController; promise: Promise<AnonymousGatewaySession> }>();
    let mutations: Promise<void> = Promise.resolve();
    const mutate = (operation: () => Promise<void>) => {
        const pending = mutations.then(operation);
        mutations = pending.catch(() => undefined);
        return pending;
    };

    const readInstallation = async (gatewayKey: string) => {
        const stored = await storage.getItemAsync(INSTALLATION_KEY);

        if (!stored) return null;

        const parsed = storedInstallationSchema.safeParse(JSON.parse(stored) as unknown);

        return parsed.success && parsed.data.gatewayKey === gatewayKey ? parsed.data : null;
    };

    const issueSession = async (
        gatewayKey: string,
        transport: RemoteGatewayTransport,
        signal: AbortSignal,
        ownedGeneration: number,
    ): Promise<AnonymousGatewaySession> => {
        const requireCurrent = () => {
            if (generation !== ownedGeneration || signal?.aborted) throw new Error('capabilities-unavailable');
        };
        requireCurrent();
        if (session?.gatewayKey === gatewayKey && session.value.expiresAt - 30_000 > Date.now()) return session.value;

        let installation = await readInstallation(gatewayKey).catch(() => null);
        requireCurrent();

        if (!installation) {
            const response = await transport.request('/v1/anonymous/installations', { method: 'POST', signal });

            requireCurrent();
            const parsed = installationResponseSchema.safeParse(response.body);

            if (response.status !== 201 || !parsed.success) throw new Error('capabilities-unavailable');

            installation = { gatewayKey, installationRef: parsed.data.installationRef, credential: parsed.data.credential };

            const stored = JSON.stringify(installation);
            await mutate(async () => {
                requireCurrent();
                await storage.setItemAsync(INSTALLATION_KEY, stored);
            });
            requireCurrent();
        }

        const response = await transport.request('/v1/anonymous/sessions', {
            method: 'POST',
            token: installation.credential,
            body: { installationRef: installation.installationRef },
            signal,
        });

        requireCurrent();
        const parsed = sessionResponseSchema.safeParse(response.body);

        if (response.status !== 201 || !parsed.success) {
            if (response.status === 401 || response.status === 403) {
                if (session?.gatewayKey === gatewayKey) session = null;
                const revoked = installation;
                await mutate(async () => {
                    requireCurrent();
                    const stored = await readInstallation(gatewayKey).catch(() => null);
                    requireCurrent();
                    if (stored?.installationRef === revoked.installationRef && stored.credential === revoked.credential)
                        await storage.deleteItemAsync(INSTALLATION_KEY);
                });
            }

            throw new Error('capabilities-unavailable');
        }

        const value = { accessToken: parsed.data.accessToken, expiresAt: Date.parse(parsed.data.expiresAt) };
        session = { gatewayKey, value };
        return value;
    };
    return {
        getSession(gatewayKey, transport, signal) {
            if (signal?.aborted) return Promise.reject(new Error('capabilities-unavailable'));
            let pending = pendingSessions.get(gatewayKey);
            if (!pending || pending.generation !== generation) {
                const controller = new AbortController();
                pending = { generation, controller, promise: issueSession(gatewayKey, transport, controller.signal, generation) };
                pendingSessions.set(gatewayKey, pending);
                const owned = pending;
                const release = () => {
                    if (pendingSessions.get(gatewayKey) === owned) pendingSessions.delete(gatewayKey);
                };
                void pending.promise.then(release, release);
            }
            const ownedGeneration = pending.generation;
            return waitForSession(pending.promise, signal).then(value => {
                if (generation !== ownedGeneration || signal?.aborted) throw new Error('capabilities-unavailable');
                return value;
            });
        },
        async clear() {
            generation++;
            session = null;
            for (const pending of pendingSessions.values()) pending.controller.abort();
            pendingSessions.clear();
            await mutate(() => storage.deleteItemAsync(INSTALLATION_KEY));
        },
        async measureBytes() {
            return (await storage.getItemAsync(INSTALLATION_KEY))?.length ?? 0;
        },
    };
}

function waitForSession(promise: Promise<AnonymousGatewaySession>, signal?: AbortSignal): Promise<AnonymousGatewaySession> {
    if (!signal) return promise;
    return new Promise((resolve, reject) => {
        const abort = () => {
            signal.removeEventListener('abort', abort);
            reject(new Error('capabilities-unavailable'));
        };
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) {
            abort();
            return;
        }
        void promise.then(
            value => {
                signal.removeEventListener('abort', abort);
                if (signal.aborted) abort();
                else resolve(value);
            },
            error => {
                signal.removeEventListener('abort', abort);
                reject(error);
            },
        );
    });
}

export const remoteProcessingIdentity = createRemoteProcessingIdentity();

export function registerRemoteProcessingIdentityDataParticipant(): () => void {
    return registerLocalDataParticipant({
        id: 'remote-processing-identity',
        measureBytes: () => remoteProcessingIdentity.measureBytes(),
        clear: () => remoteProcessingIdentity.clear(),
    });
}
