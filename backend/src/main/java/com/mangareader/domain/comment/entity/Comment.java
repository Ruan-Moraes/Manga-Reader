package com.mangareader.domain.comment.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Comentário em um título (MongoDB).
 * <p>
 * Compatível com o frontend ({@code CommentData} em comment.types.ts):
 * <pre>{ id, parentCommentId, user, isOwner, isHighlighted, wasEdited, createdAt, textContent, imageContent, dislikeCount, likeCount }</pre>
 */
@Document(collection = "comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    private String id;

    @Indexed
    private String titleId;

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
    private boolean wasEdited = false;

    private String textContent;
    private String imageContent;

    @Builder.Default
    private int likeCount = 0;

    @Builder.Default
    private int dislikeCount = 0;

    @CreatedDate
    private LocalDateTime createdAt;
}
