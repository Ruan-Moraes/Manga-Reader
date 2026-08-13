import {
    ADULT_CONTENT_OPTIONS,
    applyAdultContentPolicy,
    COMMENT_VISIBILITY_OPTIONS,
    HISTORY_VISIBILITY_OPTIONS,
    InvalidPrivacySettingsError,
    LIBRARY_VISIBILITY_OPTIONS,
    normalizePrivacySettings,
} from '@/src/entities/user';

const privacy = {
    commentVisibility: 'PUBLIC',
    viewHistoryVisibility: 'PRIVATE',
    libraryVisibility: 'PUBLIC',
    adultContentPreference: 'BLUR',
    behaviorAnalyticsEnabled: true,
} as const;

describe('MOB-FEAT-006 privacy entity', () => {
    it('expõe somente as opções permitidas em cada domínio', () => {
        expect(COMMENT_VISIBILITY_OPTIONS).toEqual(['PUBLIC', 'PRIVATE']);
        expect(LIBRARY_VISIBILITY_OPTIONS).toEqual(['PUBLIC', 'PRIVATE']);
        expect(HISTORY_VISIBILITY_OPTIONS).toEqual(['PUBLIC', 'PRIVATE', 'DO_NOT_TRACK']);
        expect(ADULT_CONTENT_OPTIONS).toEqual(['BLUR', 'HIDE', 'SHOW']);
    });

    it('normaliza DNT com analytics desligado e rejeita valor desconhecido sem default silencioso', () => {
        expect(normalizePrivacySettings({ ...privacy, viewHistoryVisibility: 'DO_NOT_TRACK' }).behaviorAnalyticsEnabled).toBe(false);
        expect(() => normalizePrivacySettings({ ...privacy, adultContentPreference: 'UNKNOWN' })).toThrow(InvalidPrivacySettingsError);
    });

    it.each([
        ['BLUR', ['safe', 'adult'], [false, true]],
        ['HIDE', ['safe'], [false]],
        ['SHOW', ['safe', 'adult'], [false, false]],
    ] as const)('aplica a semântica %s ao mesmo conjunto', (preference, ids, concealed) => {
        const items = [
            { id: 'safe', adult: false },
            { id: 'adult', adult: true },
        ];
        const result = applyAdultContentPolicy(items, preference, item => item.adult);
        expect(result.map(entry => entry.item.id)).toEqual(ids);
        expect(result.map(entry => entry.concealSensitiveMedia)).toEqual(concealed);
    });

    it('permite revelação explícita apenas para a interação BLUR informada', () => {
        const item = { id: 'adult', adult: true };
        expect(
            applyAdultContentPolicy(
                [item],
                'BLUR',
                value => value.adult,
                value => value.id === 'adult',
            )[0],
        ).toMatchObject({
            concealSensitiveMedia: false,
            canReveal: false,
        });
    });
});
