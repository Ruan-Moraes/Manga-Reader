package com.mangareader.domain.comment.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.shared.domain.vote.VoteValue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Voto de um usuário em um comentário ({@link Comment}) — MongoDB.
 * <p>
 * Modelo de voto único (igual a resenhas e tópicos de fórum): um voto por
 * usuário por comentário (índice composto único {@code commentId + userId}),
 * valor {@link VoteValue#UP}/{@link VoteValue#DOWN}.
 */
// Índice real criado em V015 (auto-index-creation=false; anotação é documentação).
@Document(collection = "comments_votes")
@CompoundIndex(name = "idx_comments_votes_comment_user", def = "{'commentId': 1, 'userId': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentVote {
    @Id
    private String id;

    private String commentId;

    private String userId;

    private VoteValue value;

    @CreatedDate
    private LocalDateTime createdAt;
}
