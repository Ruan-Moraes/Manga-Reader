package com.mangareader.domain.forum.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.mangareader.domain.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Resposta em um tópico do fórum (PostgreSQL).
 * <p>
 * Compatível com o frontend ({@code ForumReply} em forum.types.ts).
 */
@Entity
@Table(name = "forum_replies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumReply {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private ForumTopic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    private int likes = 0;

    @Column(name = "is_edited")
    @Builder.Default
    private boolean isEdited = false;

    @Column(name = "is_best_answer")
    @Builder.Default
    private boolean isBestAnswer = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
