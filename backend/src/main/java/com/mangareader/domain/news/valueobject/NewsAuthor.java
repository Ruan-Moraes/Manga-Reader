package com.mangareader.domain.news.valueobject;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Autor de uma notícia (embedded document MongoDB).
 * <p>
 * Compatível com o frontend ({@code NewsAuthor} em news.types.ts).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsAuthor {

    private String id;
    private String name;
    private String avatar;
    private String role;
    private String profileLink;
}
