package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.user.entity.ActivityEvent;
import com.mangareader.domain.user.entity.ActivityEventType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.entity.activity.ActivityPayload;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

import lombok.RequiredArgsConstructor;

/**
 * Aplica a política central de rastreamento antes de persistir um evento do
 * feed. A gravação Mongo é de documento único e, portanto, atômica; a
 * transação JPA mantém explícita a leitura das preferências do usuário.
 */
@Service
@RequiredArgsConstructor
public class RecordActivityEventUseCase {
    private final UserRepositoryPort userRepository;
    private final UserProfileSettingsResolver profileSettingsResolver;
    private final ActivityEventRepositoryPort activityEventRepository;

    @Transactional
    public void execute(String userId, ActivityEventType type, ActivityPayload payload) {
        execute(UUID.randomUUID().toString(), userId, type, payload);
    }

    @Transactional
    public void execute(String eventId, String userId, ActivityEventType type, ActivityPayload payload) {
        UUID parsedUserId = UUID.fromString(userId);
        User user = userRepository.findById(parsedUserId).orElse(null);

        if (user == null || user.isDeactivated()) {
            return;
        }
        UserProfileSettings settings = profileSettingsResolver.getOrDefault(user);

        if (settings.getViewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK) {
            return;
        }

        activityEventRepository.save(ActivityEvent.builder()
                .id(eventId == null || eventId.isBlank() ? UUID.randomUUID().toString() : eventId)
                .userId(userId)
                .type(type)
                .payload(payload)
                .build());
    }
}
