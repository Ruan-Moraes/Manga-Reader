package com.toonlira.application.user.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.manga.service.GenreValidator;
import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.user.entity.User;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza os gêneros favoritos (seleção manual) do usuário. Os slugs são
 * validados contra o vocabulário controlado de {@code tags} antes de persistir.
 */
@Service
@RequiredArgsConstructor
public class UpdateFavoriteGenresUseCase {
    private final UserRepositoryPort userRepository;
    private final GenreValidator genreValidator;

    @Transactional
    public User execute(UUID userId, List<String> favoriteGenres) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        List<String> normalized = User.normalizeFavoriteGenres(favoriteGenres);

        genreValidator.validate(normalized);

        user.updateFavoriteGenres(normalized);

        return userRepository.save(user);
    }
}
