package com.mangareader.domain.news.valueobject;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Reações a uma notícia (embedded document MongoDB).
 * <p>
 * Compatível com o frontend ({@code NewsReaction} em news.types.ts).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsReaction {

    private int like;
    private int excited;
    private int sad;
    private int surprised;
}
