package com.toonlira.application.user.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.user.entity.User;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UpdateLanguagePreferencesUseCase {
    private final UserRepositoryPort userRepository;

    @Transactional
    public User execute(UUID userId, List<String> contentLocales) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.updateContentLocales(contentLocales);

        return userRepository.save(user);
    }
}
