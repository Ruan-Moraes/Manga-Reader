package com.mangareader.application.shared.event;

/**
 * Evento emitido quando um usuário conclui a leitura de um capítulo pela
 * primeira vez.
 *
 * @param userId        ID do usuário (UUID como String)
 * @param titleId       ID do título (MongoDB)
 * @param titleName     nome resolvido do título, para exibição no feed
 * @param titleCover    capa do título, para exibição no feed
 * @param chapterNumber número do capítulo lido
 */
public record ChapterReadEvent(
        String userId,
        String titleId,
        String titleName,
        String titleCover,
        String chapterNumber
) {
}
