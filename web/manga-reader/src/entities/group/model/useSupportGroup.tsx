import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { requireAuth } from '@shared/service/util/requireAuth';
import { showErrorToast } from '@shared/service/util/toastService';

import { supportGroup, unsupportGroup } from '../api/groupService';

type SupportState = {
    following: boolean;
    supportersCount: number;
};

/**
 * Seguir/deixar de seguir um grupo, com atualização otimista — mesmo padrão
 * do follow de usuário (useFollow). Diferente daquele, o service devolve o
 * `Group` inteiro, então `following`/`supportersCount` são recalculados a
 * partir de `next.supporters` usando o id do usuário logado.
 */
export default function useSupportGroup(groupId: string | undefined, currentUserId: string | undefined, initial: SupportState) {
    const { t } = useTranslation('group');
    const queryClient = useQueryClient();
    const [state, setState] = useState<SupportState>(initial);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        setState(initial);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- dep real é o conteúdo, não a identidade do objeto
    }, [groupId, initial.following, initial.supportersCount]);

    const toggle = async () => {
        if (!groupId || pending) return;
        if (!requireAuth(t('profile.followGroup').toLowerCase())) return;

        const previous = state;
        const optimistic: SupportState = {
            following: !state.following,
            supportersCount: state.supportersCount + (state.following ? -1 : 1),
        };

        setState(optimistic);
        setPending(true);

        try {
            const next = previous.following ? await unsupportGroup(groupId) : await supportGroup(groupId);

            setState({
                following: currentUserId ? next.supporters.some(s => s.id === currentUserId) : optimistic.following,
                supportersCount: next.supporters.length,
            });

            if (currentUserId) {
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FOLLOWED_GROUPS, currentUserId] });
            }
        } catch {
            setState(previous);
            showErrorToast(t('profile.followError', { defaultValue: 'Não foi possível atualizar o follow no grupo.' }));
        } finally {
            setPending(false);
        }
    };

    return { following: state.following, supportersCount: state.supportersCount, pending, toggle };
}
