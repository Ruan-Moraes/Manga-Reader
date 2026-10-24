import { useEnrichedProfile, useFollowedGroups, type ProfileData } from '@entities/user';
import { useUserReviews, type Review } from '@entities/review';
import { useUserLibrary, type SavedMangaItem } from '@features/library';
import { type Manga } from '@entities/manga';

const toMangaFromLibrary = (item: SavedMangaItem): Manga => ({
    id: item.titleId,
    title: item.name,
    cover: item.cover,
    adult: item.adult,
    status: item.list === 'Lendo' ? 'reading' : item.list === 'Concluído' ? 'completed' : 'planned',
});

/**
 * Carrega o perfil público (header + abas) a partir do banco.
 *
 * Real (banco): header/bio, stats, seguidores/seguindo (grafo Neo4j — DT-48),
 * username/verificado, grupos seguidos (SUPPORTER), recomendações, comentários
 * recentes, resenhas, listas "lendo"/"concluído", gêneros favoritos, feed de
 * atividades.
 *
 * @param userId perfil-alvo; ausente = perfil do usuário logado.
 */
export default function useProfileData(userId?: string) {
    const { profile: enriched, loading, error } = useEnrichedProfile(userId);
    const { reviews } = useUserReviews(userId);
    const { items: lendo } = useUserLibrary(userId, 'Lendo');
    const { items: concluido } = useUserLibrary(userId, 'Concluído');
    const { groups: followedGroups } = useFollowedGroups(enriched?.id);

    const stats = enriched?.stats;
    const isOwn = enriched?.isOwner ?? false;

    const profile: ProfileData = {
        // Handle real (claim do usuário); fallback derivado do nome só para exibição.
        handle: enriched?.username ? `@${enriched.username}` : enriched ? `@${enriched.name.toLowerCase().replace(/\s+/g, '_')}` : '',
        name: enriched?.name ?? '',
        bio: enriched?.bio ?? '',
        verified: enriched?.verified ?? false,
        worksRead: stats?.lendo ?? 0,
        reviews: stats?.ratings ?? 0,
        followers: enriched?.followersCount ?? 0,
        following: enriched?.followingCount ?? 0,
        // Gêneros favoritos: seleção manual do usuário (persistida no backend).
        // TODO(tech-debt): futuramente sugerir automaticamente a partir das obras
        // mais lidas/avaliadas (mini-algoritmo) e mesclar com a seleção manual.
        genres: enriched?.favoriteGenres ?? [],
        isOwn,
    };

    return {
        loading,
        error,
        isOwn,
        profileUserId: enriched?.id,
        isFollowedByMe: enriched?.isFollowedByMe ?? false,
        profile,
        readingNow: lendo.map(toMangaFromLibrary),
        completed: concluido.map(toMangaFromLibrary),
        reviews: reviews as Review[],
        recommendations: (enriched?.recommendations ?? []).map<Manga>(r => ({
            id: r.titleId,
            title: r.titleName,
            cover: r.titleCover,
            adult: r.adult,
        })),
        recentComments: enriched?.recentComments ?? [],
        // Grupos seguidos reais (SUPPORTER); shape adaptado ao GroupCard da entity.
        groupsFollowed: followedGroups.map(g => ({
            id: g.id,
            name: g.name,
            handle: g.username,
            banner: g.banner || undefined,
            status: g.status,
            projects: g.totalTitles,
            tags: g.focusTags?.length ? g.focusTags : undefined,
        })),
    };
}
