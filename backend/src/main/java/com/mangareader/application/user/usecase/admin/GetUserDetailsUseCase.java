package com.mangareader.application.user.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna detalhes completos de um usuário para o painel admin.
 */
@Service
@RequiredArgsConstructor
public class GetUserDetailsUseCase {

    private final UserRepositoryPort userRepository;

    @Transactional(readOnly = true)
    public User execute(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.getSocialLinks().size();
        user.getRecommendations().size();

        return user;
    }
}
