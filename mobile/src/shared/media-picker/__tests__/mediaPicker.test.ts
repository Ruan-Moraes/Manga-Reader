import * as ImagePicker from 'expo-image-picker';

import appConfig from '@/app.json';

import { LOCAL_IMAGE_PICKER_OPTIONS, systemLocalMediaPicker } from '../mediaPicker';

jest.mock('expo-image-picker', () => ({
    launchImageLibraryAsync: jest.fn(),
    getPendingResultAsync: jest.fn(),
}));

describe('MOB-FEAT-012 system media picker', () => {
    it('blocks broad gallery, camera, and microphone permissions in Android config', () => {
        expect(appConfig.expo.android.blockedPermissions).toEqual(
            expect.arrayContaining([
                'android.permission.CAMERA',
                'android.permission.RECORD_AUDIO',
                'android.permission.READ_MEDIA_IMAGES',
                'android.permission.READ_EXTERNAL_STORAGE',
                'android.permission.WRITE_EXTERNAL_STORAGE',
            ]),
        );
        expect(appConfig.expo.plugins).toContainEqual(['expo-image-picker', expect.objectContaining({ cameraPermission: false, microphonePermission: false })]);
    });

    it('opens the system picker for multiple images without base64 or editing', async () => {
        jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'content://selected/one', width: 10, height: 20, mimeType: 'image/png', fileSize: 42 }],
        });

        await expect(systemLocalMediaPicker.pickImages()).resolves.toEqual({
            status: 'selected',
            images: [{ uri: 'content://selected/one', mimeType: 'image/png', fileSize: 42 }],
        });
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(LOCAL_IMAGE_PICKER_OPTIONS);
        expect(LOCAL_IMAGE_PICKER_OPTIONS).toMatchObject({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            allowsEditing: false,
            base64: false,
            exif: false,
        });
    });

    it('maps cancellation and consumes a pending Android result', async () => {
        jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: true, assets: null });
        jest.mocked(ImagePicker.getPendingResultAsync).mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'content://pending/one', width: 10, height: 20, assetId: null }],
        });

        await expect(systemLocalMediaPicker.pickImages()).resolves.toEqual({ status: 'cancelled' });
        await expect(systemLocalMediaPicker.getPendingImages()).resolves.toEqual({
            status: 'selected',
            images: [{ uri: 'content://pending/one', mimeType: null, fileSize: null }],
        });
        expect(ImagePicker.getPendingResultAsync).toHaveBeenCalledTimes(1);
    });

    it('sanitizes native failures into stable error codes', async () => {
        jest.mocked(ImagePicker.launchImageLibraryAsync).mockRejectedValue(new Error('content://private/path permission denied'));
        jest.mocked(ImagePicker.getPendingResultAsync).mockResolvedValue({ code: 'E_ACTIVITY_DOES_NOT_EXIST', message: 'private native detail' });

        await expect(systemLocalMediaPicker.pickImages()).resolves.toEqual({ status: 'error', code: 'picker-unavailable' });
        await expect(systemLocalMediaPicker.getPendingImages()).resolves.toEqual({ status: 'error', code: 'picker-unavailable' });
    });
});
