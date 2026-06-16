package com.mangareader.domain.comment.valueobject;

/**
 * Tipo de entidade-alvo (subject) a que um comentário se refere.
 * <p>
 * O modelo de comentário é unificado: uma única coleção {@code comments}
 * guarda todo comentário e resposta, polimórfica por {@code targetType} +
 * {@code targetId}. Resposta é um comentário com {@code parentCommentId}
 * preenchido (autorreferência, profundidade ilimitada).
 */
public enum CommentTarget {
    /** Comentário em um título/obra (targetId = titleId, ObjectId do Mongo). */
    TITLE,
    /** Comentário/resposta em uma resenha (targetId = reviewId). */
    REVIEW,
    /** Resposta em um tópico de fórum (targetId = forumTopicId). */
    FORUM_TOPIC;

    /** Resolve o tipo a partir do nome, case-insensitive (entrada do frontend). */
    public static CommentTarget fromValue(String value) {
        for (CommentTarget target : values()) {
            if (target.name().equalsIgnoreCase(value)) {
                return target;
            }
        }

        throw new IllegalArgumentException("targetType inválido: " + value);
    }
}
