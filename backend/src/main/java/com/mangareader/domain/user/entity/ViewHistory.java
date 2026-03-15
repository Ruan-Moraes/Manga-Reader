package com.mangareader.domain.user.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Histórico de visualização de títulos por um usuário (MongoDB).
 */
@Document(collection = "view_history")
@CompoundIndex(name = "idx_view_history_user_title", def = "{'userId': 1, 'titleId': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViewHistory {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String titleId;

    private String titleName;

    private String titleCover;

    @CreatedDate
    private LocalDateTime viewedAt;
}
