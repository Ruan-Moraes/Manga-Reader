package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Oculta um evento do feed de atividades do próprio usuário (soft-delete).
 */
@Service
@RequiredArgsConstructor
public class HideActivityEventUseCase {
    private final ActivityEventRepositoryPort activityEventRepository;

    public void execute(UUID userId, String eventId) {
        boolean hidden = activityEventRepository.hide(eventId, userId.toString());

        if (!hidden) {
            throw new ResourceNotFoundException("ActivityEvent", "id", eventId);
        }
    }
}
