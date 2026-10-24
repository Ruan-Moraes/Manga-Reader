import { inspectLocalImage, MAX_MEDIA_BYTES, type MediaInspectionIo, parseImageStructure } from '../mediaInspection';

const png = (width = 100, height = 200, animated = false) => {
    const bytes = new Uint8Array(64);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
    bytes.set([(width >>> 24) & 255, (width >>> 16) & 255, (width >>> 8) & 255, width & 255], 16);
    bytes.set([(height >>> 24) & 255, (height >>> 16) & 255, (height >>> 8) & 255, height & 255], 20);
    if (animated) bytes.set([97, 99, 84, 76], 32);
    bytes.set([73, 69, 78, 68], 56);
    return bytes;
};

const jpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0, 7, 8, 0, 20, 0, 10, 0xff, 0xd9]);
const webp = (animated = false) => {
    const bytes = new Uint8Array(30);
    bytes.set([82, 73, 70, 70, 22, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 88]);
    bytes[20] = animated ? 2 : 0;
    bytes[24] = 9;
    bytes[27] = 19;
    return bytes;
};

const io = (bytes: Uint8Array, overrides: Partial<MediaInspectionIo> = {}): MediaInspectionIo => ({
    metadata: () => ({ exists: true, size: bytes.length }),
    read: (_uri, offset, length) => bytes.slice(offset, offset + length),
    decode: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

describe('MOB-FEAT-015 media inspection', () => {
    it('recognizes static JPEG, PNG and WebP by bytes', () => {
        expect(parseImageStructure(jpeg(), jpeg(), jpeg().length)).toMatchObject({ mimeType: 'image/jpeg', width: 10, height: 20 });
        expect(parseImageStructure(png(), png().slice(-16), png().length)).toMatchObject({ mimeType: 'image/png', width: 100, height: 200 });
        expect(parseImageStructure(webp(), webp().slice(-16), webp().length)).toMatchObject({ mimeType: 'image/webp', width: 10, height: 20 });
    });

    it('accepts bounded trailing bytes after a JPEG end marker', () => {
        const image = new Uint8Array([...jpeg(), 1, 2, 3, 4]);
        expect(parseImageStructure(image, image.slice(-16), image.length)).toMatchObject({ mimeType: 'image/jpeg', width: 10, height: 20 });
    });

    it('rejects animation, unknown bytes and corruption', async () => {
        await expect(inspectLocalImage('private', png().length, io(png(100, 200, true)))).resolves.toMatchObject({
            status: 'invalid',
            error: 'UNSUPPORTED_FORMAT',
        });
        await expect(inspectLocalImage('private', 4, io(new Uint8Array([1, 2, 3, 4])))).resolves.toEqual({ status: 'invalid', error: 'UNSUPPORTED_FORMAT' });
        const broken = jpeg().slice(0, -2);
        await expect(inspectLocalImage('private', broken.length, io(broken))).resolves.toEqual({ status: 'invalid', error: 'CORRUPTED' });
    });

    it('rejects missing, empty, changed and oversized files before decode', async () => {
        const decode = jest.fn();
        await expect(inspectLocalImage('private', 1, io(new Uint8Array(), { metadata: () => ({ exists: false, size: 0 }), decode }))).resolves.toEqual({
            status: 'invalid',
            error: 'MISSING_FILE',
        });
        await expect(inspectLocalImage('private', 0, io(new Uint8Array(), { decode }))).resolves.toEqual({ status: 'invalid', error: 'EMPTY_FILE' });
        await expect(inspectLocalImage('private', 2, io(new Uint8Array([1]), { decode }))).resolves.toEqual({ status: 'invalid', error: 'FILE_CHANGED' });
        await expect(
            inspectLocalImage(
                'private',
                MAX_MEDIA_BYTES + 1,
                io(new Uint8Array([1]), { metadata: () => ({ exists: true, size: MAX_MEDIA_BYTES + 1 }), decode }),
            ),
        ).resolves.toEqual({ status: 'invalid', error: 'DIMENSIONS_UNSAFE' });
        expect(decode).not.toHaveBeenCalled();
    });

    it('validates boundaries before one bounded native decode', async () => {
        const bytes = png(5_000, 8_000);
        const adapter = io(bytes);
        await expect(inspectLocalImage('private', bytes.length, adapter)).resolves.toMatchObject({
            status: 'valid',
            mimeType: 'image/png',
            width: 5_000,
            height: 8_000,
        });
        expect(adapter.decode).toHaveBeenCalledTimes(1);

        const unsafe = png(5_001, 8_000);
        const unsafeAdapter = io(unsafe);
        await expect(inspectLocalImage('private', unsafe.length, unsafeAdapter)).resolves.toMatchObject({ status: 'invalid', error: 'DIMENSIONS_UNSAFE' });
        expect(unsafeAdapter.decode).not.toHaveBeenCalled();
    });

    it('propagates an operational decoder failure instead of classifying the file as corrupted', async () => {
        const bytes = png();
        const adapter = io(bytes, { decode: jest.fn().mockRejectedValue(new Error('native unavailable')) });
        await expect(inspectLocalImage('private', bytes.length, adapter)).rejects.toThrow('native unavailable');
    });
});
