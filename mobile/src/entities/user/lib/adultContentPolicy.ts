import type { AdultContentPreference } from '../model/privacy';

export interface SensitiveContentPresentation<T> {
    item: T;
    concealSensitiveMedia: boolean;
    canReveal: boolean;
}

export function applyAdultContentPolicy<T>(
    items: readonly T[],
    preference: AdultContentPreference,
    isAdult: (item: T) => boolean,
    isRevealed: (item: T) => boolean = () => false,
): SensitiveContentPresentation<T>[] {
    return items
        .filter(item => preference !== 'HIDE' || !isAdult(item))
        .map(item => {
            const concealed = preference === 'BLUR' && isAdult(item) && !isRevealed(item);
            return { item, concealSensitiveMedia: concealed, canReveal: concealed };
        });
}
