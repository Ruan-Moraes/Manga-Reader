package com.mangareader.domain.manga.valueobject;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Capítulo de um título (embedded document MongoDB).
 * <p>
 * Compatível com o frontend ({@code Chapter} em chapter.types.ts):
 * <pre>{ number: string, title: string, releaseDate: string, pages: string }</pre>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {

    private String number;
    private String title;
    private String releaseDate;
    private String pages;
}
