package com.mangareader.presentation.user.dto;

import java.util.List;

public record FavoriteGenresResponse(
        List<String> favoriteGenres
) {}
