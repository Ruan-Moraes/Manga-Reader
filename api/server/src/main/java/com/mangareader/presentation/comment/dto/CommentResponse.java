package com.mangareader.presentation.comment.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de comentário unificado retornado ao frontend.
 * <p>
 * {@code targetType}/{@code targetId} identificam o alvo (obra, resenha ou
 * tópico de fórum). Contadores de voto seguem o modelo único
 * ({@code upvotes}/{@code downvotes}). O voto do usuário ({@code myVote}) é
 * obtido em lote pelo endpoint {@code /user-votes}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CommentResponse(
        String id,
        String targetType,
        String targetId,
        String parentCommentId,
        String userId,
        String userName,
        String userPhoto,
        boolean isHighlighted,
        boolean edited,
        String createdAt,
        String updatedAt,
        String textContent,
        String imageContent,
        long upvotes,
        long downvotes
) {}
