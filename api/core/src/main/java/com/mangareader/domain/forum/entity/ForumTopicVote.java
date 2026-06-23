package com.mangareader.domain.forum.entity;

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
 * Voto de um usuário em um tópico do fórum ({@link ForumTopic}) — MongoDB.
 * <p>
 * Modelo de voto único (igual a resenhas e comentários): um voto por usuário
 * por tópico (índice composto único {@code topicId + userId}), valor
 * {@link VoteValue#UP}/{@link VoteValue#DOWN}. Índice real criado em V016.
 */
@Document(collection = "forum_topics_votes")
@CompoundIndex(name = "idx_forum_topics_votes_topic_user", def = "{'topicId': 1, 'userId': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumTopicVote {
    @Id
    private String id;

    private String topicId;

    private String userId;

    private VoteValue value;

    @CreatedDate
    private LocalDateTime createdAt;
}
