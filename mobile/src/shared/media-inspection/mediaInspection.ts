import { File } from 'expo-file-system';
import { Image } from 'expo-image';

export const MEDIA_VALIDATION_POLICY_VERSION = 1;
export const MAX_MEDIA_BYTES = 26_214_400;
export const MAX_MEDIA_SIDE_PX = 16_384;
export const MAX_MEDIA_PIXELS = 40_000_000;

export type DetectedMediaType = 'image/jpeg' | 'image/png' | 'image/webp';
export type MediaInspectionErrorCode = 'MISSING_FILE' | 'EMPTY_FILE' | 'FILE_CHANGED' | 'UNSUPPORTED_FORMAT' | 'CORRUPTED' | 'DIMENSIONS_UNSAFE';

export type MediaInspectionResult =
    | { status: 'valid'; mimeType: DetectedMediaType; width: number; height: number }
    | { status: 'invalid'; error: MediaInspectionErrorCode; mimeType?: DetectedMediaType; width?: number; height?: number };

export interface MediaInspectionIo {
    metadata(uri: string): { exists: boolean; size: number };
    read(uri: string, offset: number, length: number): Uint8Array;
    decode(uri: string): Promise<void>;
}

interface ParsedImage {
    mimeType: DetectedMediaType;
    width: number;
    height: number;
    animated: boolean;
}

const readUint32Be = (bytes: Uint8Array, offset: number) =>
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
const readUint32Le = (bytes: Uint8Array, offset: number) =>
    (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
const readUint24Le = (bytes: Uint8Array, offset: number) => bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
const ascii = (bytes: Uint8Array, offset: number, value: string) => [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0));

function parseJpeg(head: Uint8Array, tail: Uint8Array): ParsedImage | null {
    if (head.length < 4 || head[0] !== 0xff || head[1] !== 0xd8) return null;
    const hasEndMarker = tail.some((byte, index) => byte === 0xff && tail[index + 1] === 0xd9);
    if (!hasEndMarker) throw new Error('CORRUPTED');
    let offset = 2;
    while (offset + 8 < head.length) {
        while (head[offset] === 0xff) offset += 1;
        const marker = head[offset++];
        if (marker === 0xd8 || marker === 0xd9) continue;
        if (offset + 1 >= head.length) break;
        const length = (head[offset] << 8) | head[offset + 1];
        const startOfFrame = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
        if (startOfFrame && length >= 7 && offset + 6 < head.length) {
            return {
                mimeType: 'image/jpeg',
                height: (head[offset + 3] << 8) | head[offset + 4],
                width: (head[offset + 5] << 8) | head[offset + 6],
                animated: false,
            };
        }
        if (length < 2) throw new Error('CORRUPTED');
        offset += length;
    }
    throw new Error('CORRUPTED');
}

function parsePng(head: Uint8Array, tail: Uint8Array): ParsedImage | null {
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (head.length < 8 || !signature.every((byte, index) => head[index] === byte)) return null;
    if (head.length < 33 || !ascii(head, 12, 'IHDR') || !ascii(tail, Math.max(0, tail.length - 8), 'IEND')) throw new Error('CORRUPTED');
    return {
        mimeType: 'image/png',
        width: readUint32Be(head, 16),
        height: readUint32Be(head, 20),
        animated: Array.from({ length: Math.max(0, head.length - 3) }, (_, index) => index).some(index => ascii(head, index, 'acTL')),
    };
}

function parseWebp(head: Uint8Array, size: number): ParsedImage | null {
    if (head.length < 30 || !ascii(head, 0, 'RIFF') || !ascii(head, 8, 'WEBP')) return null;
    if (readUint32Le(head, 4) + 8 !== size) throw new Error('CORRUPTED');
    const chunk = String.fromCharCode(...head.slice(12, 16));
    if (chunk === 'VP8X') {
        return {
            mimeType: 'image/webp',
            width: readUint24Le(head, 24) + 1,
            height: readUint24Le(head, 27) + 1,
            animated: (head[20] & 0x02) !== 0,
        };
    }
    if (chunk === 'VP8L' && head[20] === 0x2f) {
        const bits = readUint32Le(head, 21);
        return { mimeType: 'image/webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, animated: false };
    }
    if (chunk === 'VP8 ' && head[23] === 0x9d && head[24] === 0x01 && head[25] === 0x2a) {
        return {
            mimeType: 'image/webp',
            width: (head[26] | (head[27] << 8)) & 0x3fff,
            height: (head[28] | (head[29] << 8)) & 0x3fff,
            animated: false,
        };
    }
    throw new Error('CORRUPTED');
}

export function parseImageStructure(head: Uint8Array, tail: Uint8Array, size: number): ParsedImage | null {
    return parseJpeg(head, tail) ?? parsePng(head, tail) ?? parseWebp(head, size);
}

export const expoMediaInspectionIo: MediaInspectionIo = {
    metadata(uri) {
        const file = new File(uri);
        return { exists: file.exists, size: file.size };
    },
    read(uri, offset, length) {
        const handle = new File(uri).open();
        try {
            handle.offset = offset;
            return handle.readBytes(length);
        } finally {
            handle.close();
        }
    },
    async decode(uri) {
        const image = await Image.loadAsync({ uri }, { maxHeight: 2_048, maxWidth: 2_048 });
        image.release();
    },
};

export async function inspectLocalImage(uri: string, expectedSize: number, io: MediaInspectionIo = expoMediaInspectionIo): Promise<MediaInspectionResult> {
    const metadata = io.metadata(uri);
    if (!metadata.exists) return { status: 'invalid', error: 'MISSING_FILE' };
    if (metadata.size === 0) return { status: 'invalid', error: 'EMPTY_FILE' };
    if (metadata.size !== expectedSize) return { status: 'invalid', error: 'FILE_CHANGED' };
    if (metadata.size > MAX_MEDIA_BYTES) return { status: 'invalid', error: 'DIMENSIONS_UNSAFE' };

    let parsed: ParsedImage | null;
    try {
        const head = io.read(uri, 0, Math.min(metadata.size, 262_144));
        const tailLength = Math.min(metadata.size, 4_096);
        const tail = io.read(uri, metadata.size - tailLength, tailLength);
        parsed = parseImageStructure(head, tail, metadata.size);
        if (!parsed) return { status: 'invalid', error: 'UNSUPPORTED_FORMAT' };
        if (parsed.animated) return { status: 'invalid', error: 'UNSUPPORTED_FORMAT', mimeType: parsed.mimeType };
        const unsafe =
            parsed.width < 1 ||
            parsed.height < 1 ||
            parsed.width > MAX_MEDIA_SIDE_PX ||
            parsed.height > MAX_MEDIA_SIDE_PX ||
            parsed.width * parsed.height > MAX_MEDIA_PIXELS;
        if (unsafe) return { status: 'invalid', error: 'DIMENSIONS_UNSAFE', mimeType: parsed.mimeType, width: parsed.width, height: parsed.height };
    } catch {
        return { status: 'invalid', error: 'CORRUPTED' };
    }

    await io.decode(uri);
    return { status: 'valid', mimeType: parsed.mimeType, width: parsed.width, height: parsed.height };
}
