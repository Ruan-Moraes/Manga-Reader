package com.mangareader.domain.comment.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.shared.domain.vote.HasVoteCounters;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Comentário unificado (MongoDB) — padrão arquitetural oficial do projeto.
 * <p>
 * Uma única coleção {@code comments} guarda TODO comentário e resposta de
 * qualquer domínio (obra/título, resenha, tópico de fórum), identificado por
 * {@code targetType} + {@code targetId}. Resposta é um comentário com
 * {@code parentCommentId} preenchido (autorreferência → profundidade
 * ilimitada). Não há coleções separadas de "replies".
 * <p>
 * Votos seguem o modelo único (ver {@link CommentVote}); contadores
 * {@code upvotes}/{@code downvotes} ficam desnormalizados aqui para leitura
 * barata na listagem.
 */
// Índice real criado em V015 (auto-index-creation=false; anotação é documentação).
@Document(collection = "comments")
@CompoundIndex(name = "idx_comments_target_language", def = "{'targetType': 1, 'targetId': 1, 'language': 1, 'createdAt': -1}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment implements HasVoteCounters {
    @Id
    private String id;

    /** Tipo da entidade-alvo comentada (TITLE, CHAPTER, NEWS, REVIEW, FORUM_TOPIC). */
    private CommentTarget targetType;

    /** Id da entidade-alvo (titleId, chapterId, newsId, reviewId ou forumTopicId). */
    @Indexed
    private String targetId;

    /** null se for comentário root; ID do pai se for resposta. */
    @Indexed
    private String parentCommentId;

    @Indexed
    private String userId;

    private String userName;
    private String userPhoto;

    @Builder.Default
    private boolean isHighlighted = false;

    @Builder.Default
    private boolean edited = false;

    private String textContent;
    private String imageContent;

    /**
     * Idioma de exibição configurado pelo usuário no momento da criação (BCP 47).
     * UGC é particionado por idioma — listagens filtram por este campo.
     */
    @Indexed
    @Builder.Default
    private String language = "pt-BR";

    @Builder.Default
    private long upvotes = 0;

    @Builder.Default
    private long downvotes = 0;

    @CreatedDate
    private LocalDateTime createdAt;

    /**
     * Última modificação de conteúdo (setada manualmente na edição). Inicializada
     * igual a {@code createdAt} na criação.
     */
    private LocalDateTime updatedAt;
}
