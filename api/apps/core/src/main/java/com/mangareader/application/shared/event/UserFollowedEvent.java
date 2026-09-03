package com.mangareader.application.shared.event;

import com.mangareader.domain.user.entity.activity.FollowTargetType;

/**
 * Evento emitido quando um usuário passa a seguir outro usuário ou grupo.
 *
 * @param userId       ID de quem passou a seguir (UUID como String)
 * @param targetType   se o alvo seguido é um usuário ou um grupo
 * @param targetId     ID do alvo seguido
 * @param targetName   nome do alvo seguido, para exibição no feed
 * @param targetAvatar avatar/capa do alvo seguido, para exibição no feed
 */
public record UserFollowedEvent(
        String userId,
        FollowTargetType targetType,
        String targetId,
        String targetName,
        String targetAvatar
) {
}
