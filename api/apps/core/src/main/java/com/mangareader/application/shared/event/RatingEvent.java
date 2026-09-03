package com.mangareader.application.shared.event;

/**
 * Evento emitido quando uma avaliação é submetida, atualizada ou excluída.
 *
 * @param titleId ID do título avaliado (MongoDB)
 * @param userId  ID do usuário que fez a ação
 */
public record RatingEvent(String titleId, String userId) {
}
