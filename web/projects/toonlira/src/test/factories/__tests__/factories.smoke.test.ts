import { describe, expect, it } from 'vitest';

import {
    admin,
    adminPaymentPresets,
    authPresets,
    buildAdminEvent,
    buildAdminGroup,
    buildAdminNews,
    buildAdminPayment,
    buildAdminTitle,
    buildAdminUser,
    buildAuthResponse,
    buildChapter,
    buildCommentData,
    buildCommentTree,
    buildContentMetrics,
    buildDashboardMetrics,
    buildEnrichedProfile,
    buildEventData,
    buildFinancialSummary,
    buildForumTopic,
    buildGroup,
    buildLibraryCounts,
    buildMangaRating,
    buildNewsItem,
    buildPage,
    buildPrivacySettings,
    buildSavedMangaItem,
    buildStore,
    buildTitle,
    buildTitlePage,
    buildUser,
    chapterPresets,
    commentTreePresets,
    eventDataPresets,
    forumTopicPresets,
    groupPresets,
    libraryCountsPresets,
    mangaRatingPresets,
    newsItemPresets,
    storePresets,
    titlePresets,
    userPresets,
} from '@/test/factories';

describe('factories smoke test', () => {
    it('every base factory returns object with id-like field', () => {
        expect(buildTitle()).toHaveProperty('id');
        expect(buildChapter()).toHaveProperty('number');
        expect(buildUser()).toHaveProperty('id');
        expect(buildAuthResponse()).toHaveProperty('userId');
        expect(buildEnrichedProfile()).toHaveProperty('id');
        expect(buildSavedMangaItem()).toHaveProperty('titleId');
        expect(buildLibraryCounts()).toHaveProperty('total');
        expect(buildMangaRating()).toHaveProperty('id');
        expect(buildCommentData()).toHaveProperty('id');
        expect(buildGroup()).toHaveProperty('id');
        expect(buildEventData()).toHaveProperty('id');
        expect(buildNewsItem()).toHaveProperty('id');
        expect(buildForumTopic()).toHaveProperty('id');
        expect(buildStore()).toHaveProperty('id');
        expect(buildPrivacySettings()).toHaveProperty('commentVisibility');
    });

    it('every admin base factory returns object with id-like field', () => {
        expect(buildAdminUser()).toHaveProperty('id');
        expect(buildAdminTitle()).toHaveProperty('id');
        expect(buildAdminNews()).toHaveProperty('id');
        expect(buildAdminEvent()).toHaveProperty('id');
        expect(buildAdminGroup()).toHaveProperty('id');
        expect(buildAdminPayment()).toHaveProperty('id');
        expect(buildDashboardMetrics()).toHaveProperty('totalUsers');
        expect(buildContentMetrics()).toHaveProperty('topTitles');
        expect(buildFinancialSummary()).toHaveProperty('countsByStatus');
    });

    it('exposes the admin namespace', () => {
        expect(admin.buildAdminPayment()).toHaveProperty('id');
        expect(admin.adminPaymentPresets.completed().status).toBe('COMPLETED');
    });

    it('counter increments produce unique IDs', () => {
        const a = buildTitle();
        const b = buildTitle();
        expect(a.id).not.toBe(b.id);
    });

    it('overrides are merged on top of defaults', () => {
        const t = buildTitle({ name: 'Custom', adult: true });
        expect(t.name).toBe('Custom');
        expect(t.adult).toBe(true);
        expect(t.type).toBe('MANGA');
    });

    it('presets return the expected scenario shape', () => {
        expect(titlePresets.adult().adult).toBe(true);
        expect(titlePresets.completed().status).toBe('completed');
        expect(chapterPresets.fractional().number).toBe('12.5');
        expect(userPresets.admin().role).toBe('admin');
        expect(authPresets.admin().role).toBe('ADMIN');
        expect(libraryCountsPresets.empty().total).toBe(0);
        expect(mangaRatingPresets.perfect().overallRating).toBe(5);
        expect(commentTreePresets.threeLevels().children.length).toBe(2);
        expect(groupPresets.hiatus().status).toBe('hiatus');
        expect(eventDataPresets.ended().status).toBe('ended');
        expect(newsItemPresets.exclusive().isExclusive).toBe(true);
        expect(forumTopicPresets.locked().isLocked).toBe(true);
        expect(storePresets.outOfStock().availability).toBe('out_of_stock');
        expect(adminPaymentPresets.refunded().status).toBe('REFUNDED');
    });

    it('buildPage produces valid pagination metadata', () => {
        const items = Array.from({ length: 25 }, (_, i) => ({ id: i }));
        const page0 = buildPage(items, 0, 10);
        expect(page0.totalPages).toBe(3);
        expect(page0.totalElements).toBe(25);
        expect(page0.last).toBe(false);

        const page2 = buildPage(items, 2, 10);
        expect(page2.last).toBe(true);
    });

    it('buildTitlePage delegates to buildPage with sensible default', () => {
        const page = buildTitlePage();
        expect(page.content.length).toBeGreaterThan(0);
        expect(page).toHaveProperty('totalElements');
        expect(page).toHaveProperty('last');
    });

    it('comment tree depth respected', () => {
        const tree = buildCommentTree(2, 3);
        expect(tree.children.length).toBe(3);
        expect(tree.children[0].children.length).toBe(3);
        expect(tree.children[0].children[0].children.length).toBe(0);
    });
});
