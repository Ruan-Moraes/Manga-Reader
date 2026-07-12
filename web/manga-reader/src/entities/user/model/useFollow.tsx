import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { requireAuth } from '@shared/service/util/requireAuth';

import { followUser, unfollowUser } from '../api/followService';

type FollowState = {
    following: boolean;
    followersCount: number;
};

/**
 * Follow/unfollow com atualização otimista (DT-48): alterna localmente na
 * hora, reconcilia com o `FollowStatusResponse` do servidor e faz rollback
 * com toast no erro — mesmo padrão do voto de resenha (useReviewVote).
 * O estado inicial vem do enriched profile (`isFollowedByMe`/`followersCount`).
 */
export default function useFollow(userId: string | undefined, initial: FollowState) {
    const { t } = useTranslation('user');
    const [state, setState] = useState<FollowState>(initial);
    const [pending, setPending] = useState(false);

    // Perfil recarregado (troca de usuário/refetch) ⇒ re-sincroniza a base.
    useEffect(() => {
        setState(initial);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- dep real é o conteúdo, não a identidade do objeto
    }, [userId, initial.following, initial.followersCount]);

    const toggle = async () => {
        if (!userId || pending) return;
        if (!requireAuth(t('profile.header.follow').toLowerCase())) return;

        const previous = state;
        const optimistic: FollowState = {
            following: !state.following,
            followersCount: state.followersCount + (state.following ? -1 : 1),
        };

        setState(optimistic);
        setPending(true);

        try {
            const next = previous.following ? await unfollowUser(userId) : await followUser(userId);

            setState({ following: next.following, followersCount: next.followersCount });
        } catch {
            setState(previous);
        } finally {
            setPending(false);
        }
    };

    return { following: state.following, followersCount: state.followersCount, pending, toggle };
}
