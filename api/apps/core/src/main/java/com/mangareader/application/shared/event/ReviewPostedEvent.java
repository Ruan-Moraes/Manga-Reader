package com.mangareader.application.shared.event;

/**
 * Evento emitido quando um usuário publica (não edita) uma resenha.
 *
 * @param userId     ID do usuário (UUID como String)
 * @param titleId    ID do título avaliado (MongoDB)
 * @param titleName  nome resolvido do título, para exibição no feed
 * @param titleCover capa do título, para exibição no feed
 * @param reviewId   ID da resenha criada
 * @param rating     nota geral atribuída
 */
public record ReviewPostedEvent(
        String userId,
        String titleId,
        String titleName,
        String titleCover,
        String reviewId,
        double rating
) {
}
