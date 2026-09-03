import type { RemoteGatewayTransport } from '@/src/shared/remote-gateway';

import { createRemoteProcessingIdentity } from '../remoteProcessingIdentity';

describe('MOB-FEAT-017 anonymous gateway identity', () => {
    it('stores only the long installation credential and keeps the short bearer in memory', async () => {
        const values = new Map<string, string>();
        const storage = {
            getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
            setItemAsync: jest.fn(async (key: string, value: string) => void values.set(key, value)),
            deleteItemAsync: jest.fn(async (key: string) => void values.delete(key)),
        };
        const request = jest
            .fn()
            .mockResolvedValueOnce({
                status: 201,
                headers: {},
                body: {
                    contractVersion: '1.0',
                    installationRef: '550e8400-e29b-41d4-a716-446655440000',
                    credential: 'c'.repeat(43),
                    createdAt: '2026-09-02T12:00:00.000Z',
                },
            })
            .mockResolvedValueOnce({
                status: 201,
                headers: {},
                body: { contractVersion: '1.0', accessToken: 's'.repeat(43), expiresAt: '2099-09-02T12:15:00.000Z' },
            });
        const transport = { request, upload: jest.fn() } as unknown as RemoteGatewayTransport;
        const identity = createRemoteProcessingIdentity(storage);

        const first = await identity.getSession('gateway-alpha', transport);
        const second = await identity.getSession('gateway-alpha', transport);

        expect(first).toEqual(second);
        expect(request).toHaveBeenCalledTimes(2);
        expect(request).toHaveBeenNthCalledWith(
            2,
            '/v1/anonymous/sessions',
            expect.objectContaining({ token: 'c'.repeat(43), body: { installationRef: '550e8400-e29b-41d4-a716-446655440000' } }),
        );
        expect([...values.values()].join(' ')).toContain('c'.repeat(43));
        expect([...values.values()].join(' ')).not.toContain('s'.repeat(43));
    });
});
