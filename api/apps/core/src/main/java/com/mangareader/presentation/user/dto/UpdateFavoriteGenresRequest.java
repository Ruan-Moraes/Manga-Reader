package com.mangareader.presentation.user.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request para atualizar os gêneros favoritos (seleção manual). Lista vazia
 * limpa a seleção; cada entrada deve ser um slug não-vazio do vocabulário de
 * gêneros.
 */
public record UpdateFavoriteGenresRequest(
        @NotNull(message = "{validation.favoriteGenres.required}")
        @Size(max = 10, message = "{validation.favoriteGenres.size}")
        List<@NotBlank(message = "{validation.favoriteGenres.blank}") String> favoriteGenres
) {}
