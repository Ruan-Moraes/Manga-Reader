package com.mangareader.presentation.comment.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de comentário retornado ao frontend.
 * <p>
 * Compatível com o frontend ({@code CommentData} em comment.types.ts).
 * O frontend espera um objeto {@code user} aninhado, mas para simplificar
 * retornamos os campos planos; a montagem do objeto user fica no frontend
 * ou em um BFF futuro.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CommentResponse(
        String id,
        String titleId,
        String parentCommentId,
        String userId,
        String userName,
        String userPhoto,
        boolean isHighlighted,
        boolean wasEdited,
        String createdAt,
        String textContent,
        String imageContent,
        String likeCount,
        String dislikeCount
) {}
