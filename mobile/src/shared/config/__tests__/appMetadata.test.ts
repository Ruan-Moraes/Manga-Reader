import { readAppMetadata } from '../appMetadata';

describe('MOB-FEAT-008/AC-007 Expo app metadata', () => {
    it('prefers native metadata and keeps version/build independently optional', () => {
        expect(
            readAppMetadata({
                nativeAppVersion: ' 2.4.0 ',
                nativeBuildVersion: ' 87 ',
                expoConfig: { version: '1.0.0', ios: { buildNumber: '10' } },
            }),
        ).toEqual({ version: '2.4.0', build: '87' });

        expect(readAppMetadata({ expoConfig: { version: '1.0.0' } })).toEqual({ version: '1.0.0', build: undefined });
        expect(readAppMetadata({ expoConfig: { android: { versionCode: 42 } } })).toEqual({ version: undefined, build: '42' });
    });

    it('does not invent metadata when Expo omits it', () => {
        expect(readAppMetadata({})).toEqual({ version: undefined, build: undefined });
        expect(readAppMetadata({ nativeAppVersion: ' ', nativeBuildVersion: '' })).toEqual({ version: undefined, build: undefined });
    });
});
