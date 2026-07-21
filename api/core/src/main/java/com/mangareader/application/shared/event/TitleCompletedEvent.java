package com.mangareader.application.shared.event;

/**
 * Evento emitido quando um usuário marca um título como concluído em sua
 * biblioteca (transição para a lista {@code CONCLUIDO}).
 *
 * @param userId     ID do usuário (UUID como String)
 * @param titleId    ID do título (MongoDB)
 * @param titleName  nome denormalizado do título, para exibição no feed
 * @param titleCover capa denormalizada do título, para exibição no feed
 */
public record TitleCompletedEvent(
        String userId,
        String titleId,
        String titleName,
        String titleCover
) {
}
