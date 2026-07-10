package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.user.entity.ActivityEvent;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

import lombok.RequiredArgsConstructor;

/**
 * Retorna o feed de atividades de um usuário, respeitando a mesma
 * configuração de privacidade do histórico de visualização
 * ({@code viewHistoryVisibility}): visitantes só veem quando a visibilidade é
 * PUBLIC; o próprio dono sempre vê.
 */
@Service
@RequiredArgsConstructor
public class GetUserActivityFeedUseCase {
    private final GetUserProfileUseCase getUserProfileUseCase;
    private final ActivityEventRepositoryPort activityEventRepository;
    private final UserProfileSettingsResolver profileSettingsResolver;

    public Page<ActivityEvent> execute(UUID targetUserId, UUID viewerUserId, Pageable pageable) {
        User user = getUserProfileUseCase.execute(targetUserId);

        boolean isOwner = viewerUserId != null && viewerUserId.equals(targetUserId);
        UserProfileSettings settings = profileSettingsResolver.getOrDefault(user);

        if (!isOwner && settings.getViewHistoryVisibility() != VisibilitySetting.PUBLIC) {
            return Page.empty(pageable);
        }

        return activityEventRepository.findVisibleByUserId(targetUserId.toString(), pageable);
    }
}
