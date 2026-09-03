package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.entity.ViewHistory;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

import lombok.RequiredArgsConstructor;

/**
 * Retorna o histórico de visualização de um usuário, respeitando a
 * configuração de privacidade: usuários não-proprietários só veem o
 * histórico quando a visibilidade é PUBLIC.
 */
@Service
@RequiredArgsConstructor
public class GetUserViewHistoryUseCase {
    private final GetUserProfileUseCase getUserProfileUseCase;
    private final ViewHistoryRepositoryPort viewHistoryRepository;
    private final UserProfileSettingsResolver profileSettingsResolver;

    public Page<ViewHistory> execute(UUID targetUserId, UUID viewerUserId, Pageable pageable) {
        User user = getUserProfileUseCase.execute(targetUserId);

        boolean isOwner = viewerUserId != null && viewerUserId.equals(targetUserId);
        UserProfileSettings settings = profileSettingsResolver.getOrDefault(user);

        if (settings.getViewHistoryVisibility() == VisibilitySetting.DO_NOT_TRACK
                || (!isOwner && settings.getViewHistoryVisibility() != VisibilitySetting.PUBLIC)) {
            return Page.empty(pageable);
        }

        return viewHistoryRepository.findByUserIdOrderByViewedAtDesc(
                targetUserId.toString(), pageable);
    }
}
