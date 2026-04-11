import type { AuthResponse } from '@feature/auth/service/authService';

let authCounter = 0;

export const buildAuthResponse = (
    overrides: Partial<AuthResponse> = {},
): AuthResponse => {
    authCounter += 1;

    return {
        accessToken: `fake-access-token-${authCounter}`,
        refreshToken: `fake-refresh-token-${authCounter}`,
        userId: `user-${authCounter}`,
        name: `Test User ${authCounter}`,
        email: `test${authCounter}@example.com`,
        role: 'MEMBER',
        photoUrl: 'https://example.com/photo.jpg',
        adultContentPreference: 'BLUR',
        ...overrides,
    };
};

export const authPresets = {
    member: () => buildAuthResponse({ role: 'MEMBER' }),
    moderator: () => buildAuthResponse({ role: 'MODERATOR' }),
    admin: () => buildAuthResponse({ role: 'ADMIN' }),

    withoutPhoto: () => buildAuthResponse({ photoUrl: undefined }),

    adultBlur: () => buildAuthResponse({ adultContentPreference: 'BLUR' }),
    adultShow: () => buildAuthResponse({ adultContentPreference: 'SHOW' }),
    adultHide: () => buildAuthResponse({ adultContentPreference: 'HIDE' }),

    longTokens: () =>
        buildAuthResponse({
            accessToken: 'a'.repeat(512),
            refreshToken: 'r'.repeat(512),
        }),

    minimal: () =>
        buildAuthResponse({
            photoUrl: undefined,
            adultContentPreference: undefined,
        }),
};
