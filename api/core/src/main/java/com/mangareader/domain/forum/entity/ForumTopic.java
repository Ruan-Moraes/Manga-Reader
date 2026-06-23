package com.mangareader.domain.forum.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.shared.domain.vote.HasVoteCounters;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tópico do fórum (MongoDB) — subject do modelo de comentário unificado.
 * <p>
 * As respostas NÃO ficam aqui: são documentos da coleção {@code comments} com
 * {@code targetType=FORUM_TOPIC} e {@code targetId} = id deste tópico
 * (padrão arquitetural oficial — sem coleções de "replies").
 * <p>
 * Autor é snapshot desnormalizado ({@code authorId}/{@code authorName}/
 * {@code authorPhoto}), como nos demais UGC do Mongo; dados vivos do autor
 * (role, postCount, joinedAt) são resolvidos na apresentação a partir do
 * Postgres. Votos seguem o modelo único ({@code forum_topics_votes});
 * {@code replyCount} é desnormalizado e reconciliado por job
 * ({@code SET = COUNT} sobre {@code comments}).
 * <p>
 * Índices reais criados em V016 (auto-index-creation=false; anotações são
 * documentação).
 */
@Document(collection = "forum_topics")
@CompoundIndex(name = "idx_forum_topics_category_language", def = "{'category': 1, 'language': 1, 'createdAt': -1}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumTopic implements HasVoteCounters {
    @Id
    private String id;

    @Indexed
    private String authorId;

    private String authorName;
    private String authorPhoto;

    private String title;

    private String content;

    /**
     * Idioma do post (BCP 47). UGC é particionado — listagens filtram por
     * este campo para evitar contaminação cross-language.
     */
    @Indexed
    @Builder.Default
    private String language = "pt-BR";

    private ForumCategory category;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private int viewCount = 0;

    /** Desnormalizado: COUNT de comments {targetType=FORUM_TOPIC, targetId=id}. */
    @Builder.Default
    private long replyCount = 0;

    @Builder.Default
    private long upvotes = 0;

    @Builder.Default
    private long downvotes = 0;

    @Builder.Default
    private boolean isPinned = false;

    @Builder.Default
    private boolean isLocked = false;

    @Builder.Default
    private boolean isSolved = false;

    /** Conteúdo do tópico foi editado após a criação. */
    @Builder.Default
    private boolean edited = false;

    @CreatedDate
    private LocalDateTime createdAt;

    /** Última atividade (criação, edição ou nova resposta). */
    private LocalDateTime lastActivityAt;

    /** Última modificação de conteúdo (setada manualmente na edição). */
    private LocalDateTime updatedAt;
}
