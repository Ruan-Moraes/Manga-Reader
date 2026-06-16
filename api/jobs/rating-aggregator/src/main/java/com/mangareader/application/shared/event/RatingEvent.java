package com.mangareader.application.shared.event;

/**
 * Evento emitido quando uma avaliação é submetida, atualizada ou excluída.
 * <p>
 * <b>Contrato de mensageria.</b> Esta classe é mantida no <b>mesmo FQN</b> do
 * publicador (api/server) para que o {@code __TypeId__} do
 * {@code Jackson2JsonMessageConverter} resolva direto. O consumer ainda usa
 * {@code TypePrecedence.INFERRED}, então é robusto mesmo se o FQN divergir.
 *
 * @param titleId ID do título avaliado (MongoDB)
 * @param userId  ID do usuário que fez a ação
 */
public record RatingEvent(String titleId, String userId) {
}
