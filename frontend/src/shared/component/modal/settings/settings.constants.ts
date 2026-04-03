import { USER_SETTINGS_STORAGE_KEY } from '@shared/constant/USER_SETTINGS_STORAGE_KEY';

export type UserSettings = {
    reading: {
        mode: 'paged' | 'continuous';
        direction: 'ltr' | 'rtl' | 'vertical';
        imageQuality: 'auto' | 'high' | 'data-saver';
        preloadPages: number;
        autoNextChapter: boolean;
        showPageNumber: boolean;
    };
    appearance: {
        theme: 'system' | 'light' | 'dark';
        compactMode: boolean;
        showMatureThumbnailsBlur: boolean;
    };
    language: {
        uiLanguage: 'pt-BR' | 'en-US' | 'es-ES';
        preferredContentLanguage: 'pt-BR' | 'en-US' | 'ja-JP' | 'es-ES';
    };
    notifications: {
        newChapterFromFollowed: boolean;
        recommendations: boolean;
        communityNews: boolean;
        events: boolean;
        email: boolean;
        push: boolean;
    };
    privacy: {
        showReadingHistory: boolean;
        showOnlineStatus: boolean;
        adultContent: 'hide' | 'blur' | 'show';
    };
};

export type TabKey =
    | 'reading'
    | 'appearance'
    | 'language'
    | 'notifications'
    | 'privacy';

export type SettingsTabProps = {
    settings: UserSettings;
    onUpdate: React.Dispatch<React.SetStateAction<UserSettings>>;
    isLoggedIn?: boolean;
};

export const defaultSettings: UserSettings = {
    reading: {
        mode: 'continuous',
        direction: 'ltr',
        imageQuality: 'auto',
        preloadPages: 2,
        autoNextChapter: true,
        showPageNumber: true,
    },
    appearance: {
        theme: 'system',
        compactMode: false,
        showMatureThumbnailsBlur: true,
    },
    language: {
        uiLanguage: 'pt-BR',
        preferredContentLanguage: 'pt-BR',
    },
    notifications: {
        newChapterFromFollowed: true,
        recommendations: true,
        communityNews: true,
        events: true,
        email: false,
        push: true,
    },
    privacy: {
        showReadingHistory: true,
        showOnlineStatus: true,
        adultContent: 'blur',
    },
};

export const sectionTitleClass =
    'text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-quaternary-default';

export const checkboxLabelClass = 'flex items-center gap-2 text-sm';

const normalizeSettings = (settings: Partial<UserSettings>): UserSettings => ({
    reading: { ...defaultSettings.reading, ...(settings.reading ?? {}) },
    appearance: {
        ...defaultSettings.appearance,
        ...(settings.appearance ?? {}),
    },
    language: { ...defaultSettings.language, ...(settings.language ?? {}) },
    notifications: {
        ...defaultSettings.notifications,
        ...(settings.notifications ?? {}),
    },
    privacy: { ...defaultSettings.privacy, ...(settings.privacy ?? {}) },
});

export const getStoredSettings = (): UserSettings => {
    try {
        const raw = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);

        if (!raw) {
            return defaultSettings;
        }

        return normalizeSettings(JSON.parse(raw) as UserSettings);
    } catch {
        return defaultSettings;
    }
};
