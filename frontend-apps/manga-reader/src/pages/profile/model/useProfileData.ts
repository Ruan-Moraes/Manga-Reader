import { PROFILES, READING_NOW, COMPLETED, REVIEWS, GROUPS_FOLLOWED, ACTIVITY } from '@mock/userProfile';
import type { ProfileData } from '@entities/user';

/**
 * Loads the public profile bundle (header + tabs data) for the profile page.
 *
 * Mock-backed (no profile aggregation backend yet) — single swap point: when the
 * API lands, only this file changes, the page stays the same.
 */
export default function useProfileData(handle: string | undefined) {
    const profile: ProfileData = PROFILES[handle ?? 'me'] ?? PROFILES['me'];

    return {
        profile,
        isOwn: !!profile.isOwn,
        readingNow: READING_NOW,
        completed: COMPLETED,
        reviews: REVIEWS,
        groupsFollowed: GROUPS_FOLLOWED,
        activity: ACTIVITY,
    };
}
