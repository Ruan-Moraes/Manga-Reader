import { CryptoDigestAlgorithm, digest } from 'expo-crypto';
import { File } from 'expo-file-system';

function toHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Bytes(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
    return toHex(await digest(CryptoDigestAlgorithm.SHA256, bytes));
}

export async function sha256File(uri: string): Promise<string> {
    return sha256Bytes(await new File(uri).bytes());
}
