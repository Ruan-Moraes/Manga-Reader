export const COMMENT_VISIBILITY_OPTIONS = ['PUBLIC', 'PRIVATE'] as const;
export const LIBRARY_VISIBILITY_OPTIONS = ['PUBLIC', 'PRIVATE'] as const;
export const HISTORY_VISIBILITY_OPTIONS = ['PUBLIC', 'PRIVATE', 'DO_NOT_TRACK'] as const;
export const ADULT_CONTENT_OPTIONS = ['BLUR', 'HIDE', 'SHOW'] as const;

export type PublicVisibility = (typeof COMMENT_VISIBILITY_OPTIONS)[number];
export type HistoryVisibility = (typeof HISTORY_VISIBILITY_OPTIONS)[number];
export type AdultContentPreference = (typeof ADULT_CONTENT_OPTIONS)[number];

export interface PrivacySettings {
    commentVisibility: PublicVisibility;
    viewHistoryVisibility: HistoryVisibility;
    libraryVisibility: PublicVisibility;
    adultContentPreference: AdultContentPreference;
    behaviorAnalyticsEnabled: boolean;
}

export type PrivacyPatch = Partial<PrivacySettings>;

export class InvalidPrivacySettingsError extends Error {
    constructor(field: keyof PrivacySettings) {
        super(`Invalid privacy settings field: ${field}`);
        this.name = 'InvalidPrivacySettingsError';
    }
}

const isOneOf = <T extends string>(value: unknown, options: readonly T[]): value is T => typeof value === 'string' && options.includes(value as T);

export function normalizePrivacySettings(value: unknown): PrivacySettings {
    if (value === null || typeof value !== 'object') throw new InvalidPrivacySettingsError('commentVisibility');
    const input = value as Record<string, unknown>;

    if (!isOneOf(input.commentVisibility, COMMENT_VISIBILITY_OPTIONS)) throw new InvalidPrivacySettingsError('commentVisibility');
    if (!isOneOf(input.viewHistoryVisibility, HISTORY_VISIBILITY_OPTIONS)) throw new InvalidPrivacySettingsError('viewHistoryVisibility');
    if (!isOneOf(input.libraryVisibility, LIBRARY_VISIBILITY_OPTIONS)) throw new InvalidPrivacySettingsError('libraryVisibility');
    if (!isOneOf(input.adultContentPreference, ADULT_CONTENT_OPTIONS)) throw new InvalidPrivacySettingsError('adultContentPreference');
    if (typeof input.behaviorAnalyticsEnabled !== 'boolean') throw new InvalidPrivacySettingsError('behaviorAnalyticsEnabled');

    return {
        commentVisibility: input.commentVisibility,
        viewHistoryVisibility: input.viewHistoryVisibility,
        libraryVisibility: input.libraryVisibility,
        adultContentPreference: input.adultContentPreference,
        behaviorAnalyticsEnabled: input.viewHistoryVisibility === 'DO_NOT_TRACK' ? false : input.behaviorAnalyticsEnabled,
    };
}

export function validatePrivacyPatch(patch: PrivacyPatch): PrivacyPatch {
    if (patch.commentVisibility !== undefined && !isOneOf(patch.commentVisibility, COMMENT_VISIBILITY_OPTIONS))
        throw new InvalidPrivacySettingsError('commentVisibility');
    if (patch.viewHistoryVisibility !== undefined && !isOneOf(patch.viewHistoryVisibility, HISTORY_VISIBILITY_OPTIONS))
        throw new InvalidPrivacySettingsError('viewHistoryVisibility');
    if (patch.libraryVisibility !== undefined && !isOneOf(patch.libraryVisibility, LIBRARY_VISIBILITY_OPTIONS))
        throw new InvalidPrivacySettingsError('libraryVisibility');
    if (patch.adultContentPreference !== undefined && !isOneOf(patch.adultContentPreference, ADULT_CONTENT_OPTIONS))
        throw new InvalidPrivacySettingsError('adultContentPreference');
    if (patch.behaviorAnalyticsEnabled !== undefined && typeof patch.behaviorAnalyticsEnabled !== 'boolean')
        throw new InvalidPrivacySettingsError('behaviorAnalyticsEnabled');
    return patch;
}
