import { useEnrichedProfile, type ProfileData } from '@entities/user';
import { useUserReviews, type Review } from '@entities/review';
import { useUserLibrary, type SavedMangaItem } from '@features/library';
import { type Manga } from '@entities/manga';

import { PROFILES, GROUPS_FOLLOWED, ACTIVITY } from '@mock/userProfile';

const toMangaFromLibrary = (item: SavedMangaItem): Manga => ({
    id: item.titleId,
    title: item.name,
    cover: item.cover,
    status: item.list === 'Lendo' ? 'reading' : item.list === 'Concluído' ? 'completed' : 'planned',
});

/**
 * Carrega o perfil público (header + abas) a partir do banco.
 *
 * Real (banco): header/bio, stats, recomendações, comentários recentes, resenhas,
 * listas "lendo"/"concluído". Ainda **mock** (sem backend — ver docs/tech-debt.md):
 * gêneros favoritos, seguidores/seguindo, grupos seguidos, feed de atividade.
 *
 * @param userId perfil-alvo; ausente = perfil do usuário logado.
 */
export default function useProfileData(userId?: string) {
    const { profile: enriched, loading, error } = useEnrichedProfile(userId);
    const { reviews } = useUserReviews(userId);
    const { items: lendo } = useUserLibrary(userId, 'Lendo');
    const { items: concluido } = useUserLibrary(userId, 'Concluído');

    const stats = enriched?.stats;
    const isOwn = enriched?.isOwner ?? false;

    const profile: ProfileData = {
        handle: enriched ? `@${enriched.name.toLowerCase().replace(/\s+/g, '_')}` : '',
        name: enriched?.name ?? '',
        bio: enriched?.bio ?? '',
        verified: false,
        worksRead: stats?.lendo ?? 0,
        reviews: stats?.ratings ?? 0,
        followers: stats?.comments ?? 0,
        following: stats?.libraryTotal ?? 0,
        // TODO(tech-debt): gêneros favoritos não têm backend — mock por ora.
        genres: PROFILES['me'].genres,
        isOwn,
    };

    return {
        loading,
        error,
        isOwn,
        profile,
        readingNow: lendo.map(toMangaFromLibrary),
        completed: concluido.map(toMangaFromLibrary),
        reviews: reviews as Review[],
        recommendations: (enriched?.recommendations ?? []).map<Manga>(r => ({
            id: r.titleId,
            title: r.titleName,
            cover: r.titleCover,
        })),
        recentComments: enriched?.recentComments ?? [],
        // TODO(tech-debt): sem backend (grafo social / grupos seguidos / feed) — mock.
        groupsFollowed: GROUPS_FOLLOWED,
        activity: ACTIVITY,
    };
}
