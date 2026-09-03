package com.mangareader.domain.user.entity.activity;

/**
 * Dado específico de um tipo de evento do feed de atividades.
 * <p>
 * Uma implementação por tipo — adicionar um evento novo é criar um record novo
 * aqui (e o tipo correspondente em {@link ActivityEventType}), sem alterar os
 * demais. O discriminador de tipo é gravado automaticamente pelo Spring Data
 * MongoDB ({@code _class}), já que o campo é declarado com este tipo interface.
 */
public sealed interface ActivityPayload
        permits ChapterReadPayload, ReviewPostedPayload, TitleCompletedPayload, UserFollowedPayload {
}
