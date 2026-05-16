package com.mangareader.domain.manga.valueobject;

import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Capítulo de um título (embedded document MongoDB).
 * <p>
 * O título do capítulo é multilíngue ({@link LocalizedString}); a API resolve
 * para o locale ativo via {@code LocaleResolutionService.resolve(...)}.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {
    private String number;
    private LocalizedString title;
    private String releaseDate;
    private String pages;
}
