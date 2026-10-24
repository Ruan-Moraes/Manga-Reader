jest.mock('expo-crypto', () => ({ CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digest: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn() }));

import { digest } from 'expo-crypto';
import { File } from 'expo-file-system';
import { createHash } from 'node:crypto';

import { sha256Bytes, sha256File } from '../fileIntegrity';

beforeEach(() => {
    jest.mocked(digest).mockImplementation(
        async (_algorithm, bytes) =>
            new Uint8Array(
                createHash('sha256')
                    .update(bytes as Uint8Array)
                    .digest(),
            ).buffer,
    );
});

describe('MOB-FEAT-019/AC-004 byte hashing and existing file hashing', () => {
    it('uses the exact byte view and emits the SHA-256 hex representation', async () => {
        const bytes = new Uint8Array([0xff, 0x61, 0x62, 0x63, 0xff]).subarray(1, 4);
        await expect(sha256Bytes(bytes)).resolves.toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
        expect(digest).toHaveBeenCalledWith('SHA-256', bytes);
        expect(digest).toHaveBeenCalledTimes(1);
        expect(File).not.toHaveBeenCalled();
    });

    it('preserves file hashing through the same byte primitive', async () => {
        const bytes = new Uint8Array([0x61, 0x62, 0x63]);
        const read = jest.fn().mockResolvedValue(bytes);
        jest.mocked(File).mockImplementation(() => ({ bytes: read }) as unknown as File);
        await expect(sha256File('file:///private/synthetic')).resolves.toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
        expect(File).toHaveBeenCalledWith('file:///private/synthetic');
        expect(read).toHaveBeenCalledTimes(1);
        expect(digest).toHaveBeenCalledTimes(1);
    });
});
