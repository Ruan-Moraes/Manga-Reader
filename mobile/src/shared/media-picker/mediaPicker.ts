import * as ImagePicker from 'expo-image-picker';

export interface PickedLocalImage {
    uri: string;
    mimeType: string | null;
    fileSize: number | null;
}

export type LocalMediaPickerResult =
    | { status: 'selected'; images: PickedLocalImage[] }
    | { status: 'cancelled' }
    | { status: 'error'; code: 'picker-unavailable' | 'invalid-result' };

export interface LocalMediaPicker {
    pickImages(options?: { selectionLimit?: number }): Promise<LocalMediaPickerResult>;
    getPendingImages(): Promise<LocalMediaPickerResult | null>;
}

export const LOCAL_IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    allowsEditing: false,
    base64: false,
    exif: false,
    quality: 1,
    orderedSelection: true,
    selectionLimit: 0,
};

function mapPickerResult(result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult): LocalMediaPickerResult {
    if ('code' in result) return { status: 'error', code: 'picker-unavailable' };
    if (result.canceled) return { status: 'cancelled' };

    const images = result.assets
        .filter(asset => asset.type !== 'video')
        .map(asset => ({
            uri: asset.uri,
            mimeType: asset.mimeType ?? null,
            fileSize: asset.fileSize ?? null,
        }))
        .filter(image => image.uri.trim().length > 0);

    return images.length > 0 ? { status: 'selected', images } : { status: 'error', code: 'invalid-result' };
}

export const systemLocalMediaPicker: LocalMediaPicker = {
    async pickImages(options) {
        try {
            const selectionLimit = options?.selectionLimit;
            const pickerOptions = selectionLimit
                ? { ...LOCAL_IMAGE_PICKER_OPTIONS, allowsMultipleSelection: selectionLimit > 1, orderedSelection: selectionLimit > 1, selectionLimit }
                : LOCAL_IMAGE_PICKER_OPTIONS;
            return mapPickerResult(await ImagePicker.launchImageLibraryAsync(pickerOptions));
        } catch {
            return { status: 'error', code: 'picker-unavailable' };
        }
    },
    async getPendingImages() {
        try {
            const result = await ImagePicker.getPendingResultAsync();
            return result ? mapPickerResult(result) : null;
        } catch {
            return { status: 'error', code: 'picker-unavailable' };
        }
    },
};
