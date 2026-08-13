import Constants from 'expo-constants';

export interface AppMetadata {
    version?: string;
    build?: string;
}

export interface ExpoMetadataSource {
    nativeAppVersion?: string | null;
    nativeBuildVersion?: string | null;
    expoConfig?: {
        version?: string;
        ios?: { buildNumber?: string };
        android?: { versionCode?: number };
    } | null;
}

const optionalText = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim();
    return normalized || undefined;
};

export function readAppMetadata(source: ExpoMetadataSource = Constants): AppMetadata {
    const version = optionalText(source.nativeAppVersion) ?? optionalText(source.expoConfig?.version);
    const nativeBuild = optionalText(source.nativeBuildVersion);
    const iosBuild = optionalText(source.expoConfig?.ios?.buildNumber);
    const androidBuild = source.expoConfig?.android?.versionCode;
    const build = nativeBuild ?? iosBuild ?? (typeof androidBuild === 'number' && Number.isFinite(androidBuild) ? String(androidBuild) : undefined);

    return { version, build };
}

export const appMetadata = {
    read: (): AppMetadata => readAppMetadata(Constants),
};
