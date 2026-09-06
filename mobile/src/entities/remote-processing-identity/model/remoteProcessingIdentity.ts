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
    let session: AnonymousGatewaySession | null = null;

    const readInstallation = async (gatewayKey: string) => {
        const stored = await storage.getItemAsync(INSTALLATION_KEY);
        if (!stored) return null;
        const parsed = storedInstallationSchema.safeParse(JSON.parse(stored) as unknown);
        return parsed.success && parsed.data.gatewayKey === gatewayKey ? parsed.data : null;
    };

    return {
        async getSession(gatewayKey, transport, signal) {
            if (session && session.expiresAt - 30_000 > Date.now()) return session;
            let installation = await readInstallation(gatewayKey).catch(() => null);
            if (!installation) {
                const response = await transport.request('/v1/anonymous/installations', { method: 'POST', signal });
                const parsed = installationResponseSchema.safeParse(response.body);
                if (response.status !== 201 || !parsed.success) throw new Error('capabilities-unavailable');
                installation = { gatewayKey, installationRef: parsed.data.installationRef, credential: parsed.data.credential };
                await storage.setItemAsync(INSTALLATION_KEY, JSON.stringify(installation));
            }
            const response = await transport.request('/v1/anonymous/sessions', {
                method: 'POST',
                token: installation.credential,
                body: { installationRef: installation.installationRef },
                signal,
            });
            const parsed = sessionResponseSchema.safeParse(response.body);
            if (response.status !== 201 || !parsed.success) {
                if (response.status === 401 || response.status === 403) {
                    session = null;
                    await storage.deleteItemAsync(INSTALLATION_KEY);
                }
                throw new Error('capabilities-unavailable');
            }
            session = { accessToken: parsed.data.accessToken, expiresAt: Date.parse(parsed.data.expiresAt) };
            return session;
        },
        async clear() {
            session = null;
            await storage.deleteItemAsync(INSTALLATION_KEY);
        },
        async measureBytes() {
            return (await storage.getItemAsync(INSTALLATION_KEY))?.length ?? 0;
        },
    };
}

export const remoteProcessingIdentity = createRemoteProcessingIdentity();

export function registerRemoteProcessingIdentityDataParticipant(): () => void {
    return registerLocalDataParticipant({
        id: 'remote-processing-identity',
        measureBytes: () => remoteProcessingIdentity.measureBytes(),
        clear: () => remoteProcessingIdentity.clear(),
    });
}
